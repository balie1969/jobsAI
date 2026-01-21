import { User } from "@/lib/db";
import { AlertTriangle, FileText, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardNotificationsProps {
    user: User | null;
    cvCount: number;
}

export function DashboardNotifications({ user, cvCount }: DashboardNotificationsProps) {
    if (!user) return null;

    const missingProfileInfo = !user.adresse || !user.postnr || !user.sted || !user.mobil;
    const missingCV = cvCount === 0;

    if (!missingProfileInfo && !missingCV) return null;

    return (
        <div className="flex flex-col gap-4 mb-8">
            {missingCV && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-900">Du mangler CV!</h3>
                        <p className="text-sm text-red-700 mt-1">
                            For at vi skal kunne finne relevante jobber til deg, må du laste opp din CV.
                        </p>
                    </div>
                    {/* We rely on the user opening the profile sheet manually for now, or we could trigger it if we had a context. 
                        Since the profile button is right there, a text prompt is good. */}
                </div>
            )}

            {missingProfileInfo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                        <UserIcon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-amber-900">Din profil er ikke komplett</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Legg inn adresse og telefonnummer for å gjøre søknadsprosessen enklere.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
