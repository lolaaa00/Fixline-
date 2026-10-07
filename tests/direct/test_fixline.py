import json
import pytest

CONTRACT = "contracts/fixline.py"
REPO = "https://github.com/example/public-project"
CRITERIA = json.dumps(["A regression test demonstrates the previous failure.", "The submitted revision implements the documented behavior."])
HOSTS = json.dumps(["github.com"])
AWARD = 10**18

def as_contract_address(contract, value):
    return contract._zero().__class__("0x" + bytes(value).hex())

def create_work(contract, vm, sponsor, contributor):
    sponsor = as_contract_address(contract, sponsor)
    contributor = as_contract_address(contract, contributor)
    vm.sender = sponsor
    vm.value = AWARD
    contract.open_work(contributor, "Repair retry handling", "A bounded public change.", REPO, CRITERIA, HOSTS, 2_000_000_000, 2_000_100_000, AWARD)
    vm.value = 0


def test_fund_and_accept(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    create_work(contract, direct_vm, direct_alice, direct_bob)
    work = contract.get_work(1)
    assert int(work.award) == AWARD
    assert int(work.status) == 0
    direct_vm.sender = as_contract_address(contract, direct_bob)
    contract.accept_work(1)
    assert int(contract.get_work(1).status) == 1


def test_rejects_wrong_funding(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = as_contract_address(contract, direct_alice)
    direct_vm.value = AWARD - 1
    with pytest.raises(Exception):
        contract.open_work(as_contract_address(contract, direct_bob), "Repair retry handling", "A bounded public change.", REPO, CRITERIA, HOSTS, 2_000_000_000, 2_000_100_000, AWARD)


def test_only_named_contributor_accepts(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(CONTRACT)
    create_work(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = as_contract_address(contract, direct_charlie)
    with pytest.raises(Exception):
        contract.accept_work(1)


def test_delivery_is_revision_bound_and_duplicate_safe(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    create_work(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = as_contract_address(contract, direct_bob)
    contract.accept_work(1)
    revision = "a" * 40
    url = REPO + "/commit/" + revision
    evidence = json.dumps(["See the regression test in the diff.", "See the implementation file in the diff."])
    contract.deliver_revision(1, revision, url, "", evidence)
    assert int(contract.get_work(1).status) == 2
    assert contract.get_submission(1, 1).revision == revision
    with pytest.raises(Exception):
        contract.deliver_revision(1, revision, url, "", evidence)


def test_rejects_evidence_outside_frozen_repository(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    create_work(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = as_contract_address(contract, direct_bob)
    contract.accept_work(1)
    with pytest.raises(Exception):
        contract.deliver_revision(1, "b" * 40, "https://github.com/attacker/project/commit/" + "b" * 40, "", json.dumps(["x", "y"]))


def test_sponsor_can_withdraw_only_before_acceptance(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    create_work(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.sender = as_contract_address(contract, direct_alice)
    contract.withdraw_unaccepted(1)
    assert int(contract.get_work(1).status) == 6
    assert int(contract.get_work(1).remaining) == 0
    with pytest.raises(Exception):
        contract.withdraw_unaccepted(1)


def prepare_delivery(contract, vm, sponsor, contributor):
    create_work(contract, vm, sponsor, contributor)
    vm.sender = as_contract_address(contract, contributor)
    contract.accept_work(1)
    revision = "c" * 40
    contract.deliver_revision(1, revision, REPO + "/commit/" + revision, "", json.dumps(["Regression test is visible in the diff.", "Implementation is visible in the diff."]))


def test_consensus_qualified_awards_once(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    prepare_delivery(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.mock_web("github.com", {"status": 200, "body": "public commit diff and passing test"})
    direct_vm.mock_llm("bounded public software delivery", json.dumps({"outcome": "QUALIFIED", "results": ["SATISFIED", "SATISFIED"], "rationale": "Both frozen criteria are supported by the revision."}))
    contract.review_delivery(1, 1)
    work = contract.get_work(1)
    assert int(work.status) == 5
    assert int(work.remaining) == 0
    assert int(work.winning_submission) == 1
    with pytest.raises(Exception):
        contract.review_delivery(1, 1)


def test_consensus_uncertainty_never_pays(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    prepare_delivery(contract, direct_vm, direct_alice, direct_bob)
    direct_vm.mock_web("github.com", {"status": 200, "body": "commit exists but test evidence is incomplete"})
    direct_vm.mock_llm("bounded public software delivery", json.dumps({"outcome": "INSUFFICIENT_EVIDENCE", "results": ["SATISFIED", "UNPROVEN"], "rationale": "The implementation criterion is not proven."}))
    contract.review_delivery(1, 1)
    work = contract.get_work(1)
    submission = contract.get_submission(1, 1)
    assert int(work.status) == 4
    assert int(work.remaining) == AWARD
    assert submission.outcome == "INSUFFICIENT_EVIDENCE"
