import { Button } from "@/components/ui/button";
import { 
    DropdownMenu ,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel, 
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FaGear } from "react-icons/fa6";

const SettingsMenu = () => {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon-lg" className="bg-inherit">
                <FaGear />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32" align="start">
            <DropdownMenuItem>
                Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
                Log Out
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SettingsMenu