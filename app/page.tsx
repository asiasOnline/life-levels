import Image from "next/image";
import StatContainer from "@/components/features/stats/stat-container";
import CharacterContainer from "@/components/features/characters/character-container";
import TaskContainer from "@/components/features/tasks/task-container";
import { StatData } from "@/lib/types";
import { FaHeart, FaFire } from "react-icons/fa6";
import { RiCopperCoinFill } from "react-icons/ri";

export default function Dashboard() {
  const userStats: StatData[] = [
    {
      type: 'health',
      label: 'Health',
      value: 85,
      maxValue: 100,
      icon: <FaHeart className="text-red-500 w-5 h-5"/>
    }, 
    {
      type: 'gold',
      label: 'Gold',
      value: 30,
      icon: <RiCopperCoinFill className="text-yellow-500 w-6 h-6"/>
    }, 
    {
      type: 'streak',
      label: 'Streak',
      value: 4,
      icon: <FaFire className="text-orange-500 w-6 h-6"/>
    }, 
  ]

  return (
    <div>
      <div>
        <h1 className="text font-semibold">Dashboard</h1>
        <h1 className="text-3xl font-bold">Good Morning, Asia!</h1>
      </div>
      <div className="w-80">
        <StatContainer 
          stats={userStats}
          layout="horizontal"
          displayMode="numeric"
          className="my-4"
        />
        <CharacterContainer />    
      </div>
      <TaskContainer />
    </div>
  );
}
