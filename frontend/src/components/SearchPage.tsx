import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
}

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'hashtag'>('name');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  const performSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/search`, {
        params: { 
          term: searchTerm, 
          type: searchType 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error performing search:', error);
    }
  };

  const handleSearchTypeChange = (type: 'name' | 'hashtag') => {
    setSearchType(type);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1819]">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 mx-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder={searchType === 'name' ? "Search by name" : "Search by hashtag"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-zinc-800 border-none rounded-full text-white placeholder-zinc-400"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 mt-4">
        <Button
          variant={searchType === 'name' ? 'default' : 'outline'}
          onClick={() => handleSearchTypeChange('name')}
          className={`${searchType === 'name' ? 'bg-[#d6191e]' : 'bg-zinc-800'} text-white`}
        >
          Search by Name
        </Button>
        <Button
          variant={searchType === 'hashtag' ? 'default' : 'outline'}
          onClick={() => handleSearchTypeChange('hashtag')}
          className={`${searchType === 'hashtag' ? 'bg-[#d6191e]' : 'bg-zinc-800'} text-white`}
        >
          Search by Hashtag
        </Button>
      </div>

      <div className="mt-4 px-4">
        {searchResults.map((result) => (
          <div 
            key={result._id} 
            className="flex items-center space-x-4 py-2 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800"
            onClick={() => handleUserClick(result._id)}
          >
            <img
              src={result.avatar || '/placeholder.svg'}
              alt={result.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-semibold">{result.displayName || result.username}</p>
              <p className="text-sm text-zinc-400">@{result.username}</p>
            </div>
          </div>
        ))}
        {searchTerm && searchResults.length === 0 && (
          <p className="text-center text-zinc-400 mt-4">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;



