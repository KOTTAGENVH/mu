import React from "react";
import SettingCard from "./card";
import {
  faLayerGroup,
  faHeart,
  faMagnifyingGlass,
  faShieldHalved,
  faMusic,
  faMask,
  faRotateLeft,
  faArrowsLeftRight,
} from "@fortawesome/free-solid-svg-icons";

interface RenderProps {
  onSettingSelect: (id: number) => void;
}

function SettingCardRender({ onSettingSelect }: RenderProps) {

  const settings = [
    {
      id: 1,
      title: "Manage Categories",
      icon: faLayerGroup,
    },
    {
      id: 2,
      title: "Manage Wish Lists",
      icon: faHeart,
    },
    {
      id: 5,
      title: "Manage Audio",
      icon: faMusic,
    },
    {
      id: 3,
      title: "Semantic Search",
      icon: faMagnifyingGlass,
    },
    {
      id: 4,
      title: "Change Authenticator app",
      icon: faShieldHalved,
    },
    {
      id: 6,
      title: "Mask Songs",
      icon: faMask,
    },
    {
      id: 7,
      title: "Reset Equalizer",
      icon: faRotateLeft,
    },
    {
      id: 8,
      title: "Volume Leveler",
      icon: faArrowsLeftRight,
    }
  ];
  

  return (
    <div className="justify-center items-center w-auto h-auto  mx-4 px-3 lg:mx-16 lg:px-6 flex flex-row gap-6 flex-wrap mt-8 mb-8">
      {settings.map((setting) => (
        <SettingCard
          key={setting.id}
          id={setting.id}
          title={setting.title}
          icon={setting.icon}
          onClick={onSettingSelect}
        />
      ))}
    </div>
  );
}

export default SettingCardRender;
