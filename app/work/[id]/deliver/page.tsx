import { DeliveryPage } from "@/components/work-room";
export default async function Page({ params }: { params: Promise<{id:string}> }) { const {id}=await params; return <DeliveryPage id={Number(id)}/>; }
