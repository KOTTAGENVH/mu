import React, { useState, useEffect, useRef } from 'react';

interface Audio {
  _id: string;
  name: string;
  category: string;
  fileUrl: string;
  favourite: boolean;
}

const AudioPlayer: React.FC = () => {
  const [audioList, setAudioList] = useState<Audio[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio from the API
  const fetchAudio = async () => {
    try {
      const res = await fetch('/api/services/audio', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setAudioList(data.uploads);
    } catch (error) {
      console.error('Error fetching audio:', error);
    }
  };

  useEffect(() => {
    fetchAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleNext);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleNext);
      }
    };
  }, [currentAudioIndex]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    setCurrentAudioIndex((prevIndex) => 
      prevIndex === 0 ? audioList.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    if (isShuffling) {
      setCurrentAudioIndex(Math.floor(Math.random() * audioList.length));
    } else {
      setCurrentAudioIndex((prevIndex) =>
        prevIndex === audioList.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop;
      setIsLooping(audioRef.current.loop);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        playAudio();
      } else {
        pauseAudio();
      }
    }
  }, [currentAudioIndex]);

  if (!audioList.length) {
    return <div>Loading audio files...</div>;
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Audio Player</h2>
      <h3>{audioList[currentAudioIndex].name}</h3>
      <audio ref={audioRef} src={audioList[currentAudioIndex].fileUrl} />
      <div>
        <button onClick={handlePrev}>Previous</button>
        {isPlaying ? (
          <button onClick={pauseAudio}>Pause</button>
        ) : (
          <button onClick={playAudio}>Play</button>
        )}
        <button onClick={handleNext}>Next</button>
      </div>
      <div>
        <button onClick={toggleShuffle}>
          {isShuffling ? 'Disable Shuffle' : 'Enable Shuffle'}
        </button>
        <button onClick={toggleLoop}>
          {isLooping ? 'Disable Loop' : 'Enable Loop'}
        </button>
      </div>
      <div>
        <h4>Playlist</h4>
        <ul>
          {audioList.map((audio, index) => (
            <li
              key={audio._id}
              onClick={() => setCurrentAudioIndex(index)}
              style={{
                cursor: 'pointer',
                fontWeight: index === currentAudioIndex ? 'bold' : 'normal',
              }}
            >
              {audio.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AudioPlayer;
