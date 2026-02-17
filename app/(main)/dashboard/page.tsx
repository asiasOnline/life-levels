import { getUser } from '@/lib/auth/get-user'
import StatContainer from "@/components/features/stats/stat-container";
import CharacterContainer from "@/components/features/characters/character-container";
import NewEventButton from "@/components/features/schedule/new-event-button";
import { StatData } from "@/lib/types";
import { FaHeart, FaFire } from "react-icons/fa6";
import { RiCopperCoinFill } from "react-icons/ri";

export default async function Dashboard() {
  const user = await getUser()

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
        <h1 className="text-3xl font-bold">Good Morning, {user.email}!</h1>
      </div>
      <div className="flex">
        <div className="w-100">
          <StatContainer 
            stats={userStats}
            layout="horizontal"
            displayMode="numeric"
            className="my-4"
          />
          <CharacterContainer />    
        </div>
        <div>
          <div className="flex gap-4">
            <NewEventButton />
          </div>
        </div>
      </div>
    </div>
  );
}
