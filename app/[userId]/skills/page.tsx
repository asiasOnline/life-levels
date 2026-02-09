import SkillContainer from "@/components/features/skills/skill-container";
import SearchBar from "@/components/layout/search-bar";

export default function Skills() {
    return (
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-3">Skills</h1>
        <p className="text-sm">Define and develop the skills that matter.</p>
        <div>
          <SkillContainer />
        </div>
      </div>
    );
  }