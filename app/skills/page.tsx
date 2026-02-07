import SearchBar from "@/components/layout/search-bar";

export default function Skills() {
    return (
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-3">Skills</h1>
        <p className="text-sm">Create and update skill categories that are relevant to your journey.</p>
        <div>
          <div>
            <SearchBar />
          </div>
        </div>
      </div>
    );
  }