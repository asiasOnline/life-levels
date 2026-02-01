import Image from "next/image";
import StatContainer from "@/components/features/stats/stat-container";
import { StatData } from "@/lib/types";


export default function Dashboard() {
  const userStats: StatData[] = [
    {
      type: 'health',
      label: 'Health',
      value: 85,
      maxValue: 100,
      
    }
  ]

  return (
    <div>
      <div>
        <h1 className="text font-semibold">Dashboard</h1>
        <h1 className="text-3xl font-bold">Good Morning, Asia!</h1>
      </div>
    </div>
  );
}
