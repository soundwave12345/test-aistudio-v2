import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative w-full mb-6">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-subsonic-secondary">
        <Search size={20} />
      </div>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/10 border border-white/5 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-subsonic-primary transition-all"
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;