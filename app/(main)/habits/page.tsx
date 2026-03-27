'use client'

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/app/page-header";
import ItemContainer from "@/components/layout/app/item-container";
import { ItemContainerHeader } from "@/components/layout/app/item-container-header";
import { ViewMode } from "@/components/layout/app/item-container-header";


export default function Habits() {
    return (
      <>
      <PageHeader 
        title="Habits"
        subtitle="Recurring activities that help develop consistent behaviors."
      />
      </>
    );
  }