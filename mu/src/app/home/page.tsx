"use client";
// import AdSense from '@/components/adsterra';
import Drawer from '@/components/drawer';
import IframeComp from '@/components/iframeComp';
import React from 'react'

function Page() {
  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-auto">
     <Drawer />
     <div className='flex flex-row flex-wrap  h-96 w-screen'>
      <IframeComp/>
      </div>
    </div>
  )
}

export default Page;
