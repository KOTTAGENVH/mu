"use client";
import Drawer from '@/components/drawer';
import React from 'react'

function Page() {
  return (
    <div className="h-screen w-screen dark:bg-slate-950 bg-slate-300 overflow-auto">
     <Drawer />
    </div>
  )
}

export default Page;
