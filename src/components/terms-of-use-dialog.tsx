
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export function TermsOfUseDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                    Vilkår for bruk
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Vilkår for bruk</DialogTitle>
                    <DialogDescription>
                        Vilkår og betingelser for bruk av Beautiful Norways tjenester.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h1>Vilkår for bruk</h1>

                        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 my-6 text-sm text-gray-600 dark:bg-slate-900 dark:border-slate-700 dark:text-gray-300">
                            Ved å bruke Beautiful Norway aksepterer du disse vilkårene. Vennligst les dem nøye for å forstå dine rettigheter og plikter.
                        </div>

                        <h2>1. Aksept av vilkår</h2>
                        <p>Ved å opprette en konto eller benytte tjenestene til Beautiful Norway, bekrefter du at du har lest, forstått og samtykket til disse vilkårene, samt vår personvernerklæring.</p>

                        <h2>2. Brukerkonto og sikkerhet</h2>
                        <ul>
                            <li><strong>Ansvar:</strong> Du er selv ansvarlig for å beskytte ditt passord og for all aktivitet som skjer på din konto.</li>
                            <li><strong>Nøyaktighet:</strong> Du plikter å oppgi korrekt informasjon ved registrering og holde din profil oppdatert.</li>
                            <li><strong>Misbruk:</strong> Vi forbeholder oss retten til å suspendere kontoer som benyttes til ulovlige formål eller bryter våre retningslinjer.</li>
                        </ul>

                        <h2>3. Tjenestens omfang og AI-generert innhold</h2>
                        <p>Vår tjeneste benytter avansert teknologi for å hjelpe deg i jobbsøkerprosessen:</p>
                        <ul>
                            <li><strong>Assistanse, ikke garanti:</strong> AI-scoring og generering av søknader er ment som beslutningsstøtte. Vi garanterer ikke jobbintervjuer eller ansettelse som resultat av tjenesten.</li>
                            <li><strong>Kvalitetssikring:</strong> Du er selv ansvarlig for å gå gjennom, korrigere og verifisere alt innhold (f.eks. PDF-søknader) som genereres av AI før du sender det til en arbeidsgiver.</li>
                            <li><strong>Ansvarsbegrensning:</strong> Beautiful Norway er ikke ansvarlig for eventuelle feil eller unøyaktigheter i data hentet fra eksterne kilder som Finn.no.</li>
                        </ul>

                        <h2>4. Immaterielle rettigheter</h2>
                        <ul>
                            <li><strong>Dine data:</strong> Du eier din CV, dine data og tekstene som genereres spesifikt for deg.</li>
                            <li><strong>Vår plattform:</strong> Beautiful Norway eier alle rettigheter til plattformen, kildekoden, designet og algoritmene bak tjenesten.</li>
                        </ul>

                        <h2>5. Begrensninger i bruk</h2>
                        <p>Det er ikke tillatt å:</p>
                        <ul>
                            <li>Bruke tjenesten til å generere spam eller villedende innhold.</li>
                            <li>Forsøke å dekompilere, reversere eller utvinne kildekoden til våre systemer.</li>
                            <li>Automatisere uthenting av data fra vår plattform uten skriftlig samtykke.</li>
                        </ul>

                        <h2>6. Endringer i tjenesten</h2>
                        <p>Vi forbedrer kontinuerlig våre systemer. Vi forbeholder oss retten til å endre funksjonalitet, priser eller vilkår med rimelig varsel til våre brukere.</p>

                        <h2>7. Lovvalg og verneting</h2>
                        <p>Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal forsøkes løst i minnelighet, og hvis ikke skal de bringes inn for norske domstoler med Oslo som verneting.</p>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
                            <p className="text-sm text-gray-500 italic">
                                Sist oppdatert: 20. januar 2026
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end">
                    {/* Can add explicit close button here if needed, but DialogClose does it or user clicks outside */}
                    <DialogTrigger asChild>
                        <Button variant="outline">Lukk</Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}
