"use client";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import Header from "@/components/header";
import FileUpload from "@/components/fileUpload";

function Page() {
  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-auto">
      <Header icon={faArrowCircleLeft} btnNav="/home" text="Audio Upload" />
      <div
        className={`flex flex-col h-5/6 justify-center items-center m-2 p-2`}
      >
        <FileUpload />
      </div>
    </div>
  );
}

export default Page;
