import React from "react";
import { getActivities } from "@/app/activities/actions";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ActivitiesClient from "./ActivitiesClient";

export default async function ActivitiesPage(props: {
    searchParams: Promise<{ month?: string; year?: string; message?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const month = searchParams.month ? parseInt(searchParams.month) : undefined;
    const year = searchParams.year ? parseInt(searchParams.year) : undefined;

    const session = await auth();
    const user = session?.user;

    if (!user) {
        return redirect("/login");
    }

    const activities = await getActivities(month, year);

    return <ActivitiesClient
        initialActivities={activities}
        currentMonth={month}
        currentYear={year}
        message={searchParams.message}
        type={searchParams.type}
    />;
}
