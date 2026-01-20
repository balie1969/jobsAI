
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

export function PrivacyPolicyDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                    Sikkerhet og Personvern
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Sikkerhet og Personvern</DialogTitle>
                    <DialogDescription>
                        Informasjon om hvordan vi sikrer dine data og ditt personvern.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h1>Sikkerhet og Personvern</h1>

                        <p>
                            Hos <strong>Beautiful Norway</strong> er din tillit vår viktigste ressurs. Vi har bygget vår tjeneste med personvern som grunnmur (&quot;Privacy by Design&quot;), og vi er dedikerte til å beskytte dine data med markedsledende sikkerhetsstandarder.
                        </p>

                        <hr className="my-6" />

                        <h3>1. Vår tilnærming til sikkerhet og personvern</h3>
                        <p>
                            Vi ser på sikkerhet som en kontinuerlig prosess. Vår plattform er designet for å hjelpe deg i karrieren uten at du trenger å bekymre deg for hvor dataene dine havner. Vi etterlever kravene i EUs personvernforordning (GDPR) og norske personvernlover.
                        </p>

                        <h3>2. Informasjonssikkerhet</h3>
                        <p>
                            Vi benytter en lagdelt sikkerhetsmodell. Alle våre systemer driftes på dedikerte, sikre servere (VPS) med strenge brannmurregler og oppdaterte sikkerhetsoppdateringer. Systemet er konfigurert for å minimere angrepsflaten mot uvedkommende.
                        </p>

                        <h3>3. Autorisering og tilgang</h3>
                        <ul>
                            <li><strong>Identitetsstyring:</strong> Vi benytter moderne autentiseringsprotokoller (som JWT) for å sikre at kun du har tilgang til din profil og dine dokumenter.</li>
                            <li><strong>Tilgangsbegrensning:</strong> Kun autorisert personell med tjenstlig behov har tilgang til systemets backend, og alle tilganger er beskyttet med multifaktor-autentisering (MFA).</li>
                        </ul>

                        <h3>4. Kryptering</h3>
                        <ul>
                            <li><strong>Under transport:</strong> All data som sendes mellom din nettleser og våre servere er kryptert med <strong>TLS 1.3</strong> (HTTPS).</li>
                            <li><strong>Ved lagring:</strong> Sensitive data i vår Postgres-database er beskyttet mot uautorisert innsyn gjennom kryptering på filsystemnivå og strenge tilgangskontroller.</li>
                        </ul>

                        <h3>5. Logging og overvåking</h3>
                        <p>
                            Vi overvåker våre systemer 24/7 for å oppdage og forhindre mistenkelig aktivitet. Vi logger tekniske hendelser for å sikre stabil drift, men vi logger aldri innholdet i dine private dokumenter eller AI-genererte søknader utenfor det som er strengt nødvendig for teknisk feilsøking.
                        </p>

                        <h3>6. AI-bruk og databehandling</h3>
                        <p>Når vi benytter AI for å score stillinger eller skrive søknader:</p>
                        <ul>
                            <li>Dine data blir <strong>aldri</strong> brukt til å trene offentlige AI-modeller.</li>
                            <li>Vi benytter kun Enterprise-versjoner av AI-tjenester som garanterer at data slettes umiddelbart etter prosessering.</li>
                            <li>AI-en ser kun den informasjonen som er nødvendig for å utføre den spesifikke oppgaven (f.eks. din CV og en stillingsbeskrivelse).</li>
                        </ul>

                        <h3>7. Dataminimering og lagring</h3>
                        <p>
                            Vi følger prinsippet om dataminimering: Vi samler kun inn informasjon som er strengt nødvendig for å levere tjenesten.
                        </p>
                        <ul>
                            <li>Vi lagrer ikke data lenger enn nødvendig.</li>
                            <li>Du kan når som helst slette din profil, noe som medfører permanent sletting av dine tilknyttede data fra vår aktive database.</li>
                        </ul>

                        <h3>8. Dataplassering (Lagret i Norge)</h3>
                        <p>
                            All lagring av personopplysninger skjer utelukkende på servere lokalisert i Norge. Dette sikrer at dine data er beskyttet av norsk jurisdiksjon og gir deg som bruker ekstra trygghet rundt personvern og nasjonal kontroll.
                        </p>

                        <h3>9. Brukerrettigheter</h3>
                        <p>I samsvar med GDPR har du rett til:</p>
                        <ul>
                            <li>Innsyn i egne data.</li>
                            <li>Korrigering av uriktige opplysninger.</li>
                            <li>Sletting av data (&quot;retten til å bli glemt&quot;).</li>
                            <li>Dataportabilitet (ta med deg dine data til en annen tjeneste).</li>
                            <li>Begrensning av eller innsigelse mot behandling.</li>
                        </ul>

                        <h3>10. Organisatoriske tiltak</h3>
                        <p>
                            Vi har interne rutiner for håndtering av personopplysninger, inkludert regelmessige sikkerhetsrevisjoner og opplæring i personvern. Vi krever også databehandleravtaler med alle underleverandører som prosesserer data på våre vegne.
                        </p>

                        <h3>11. Dokumentasjon og etterlevelse</h3>
                        <p>
                            Vi dokumenterer alle våre behandlingsaktiviteter i en protokoll. Dette inkluderer formålet med behandlingen, hvilke kategorier av data som behandles, og hvor lenge de lagres.
                        </p>

                        <h3>12. Tillit for brukere</h3>
                        <p>
                            Vårt mål er full åpenhet. Vi vil varsle deg umiddelbart dersom det skulle oppstå et avvik som har betydning for dine personopplysninger.
                        </p>

                        <hr className="my-6" />

                        <h3>Kontakt oss</h3>
                        <p>
                            Har du spørsmål om hvordan vi håndterer dine data? Ta kontakt med vår personvernansvarlig på:<br />
                            <strong>E-post:</strong> <a href="mailto:privacy@beautifulnorway.info" className="text-blue-600 hover:underline">privacy@beautifulnorway.info</a>
                        </p>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
                            <p className="text-sm text-gray-500 italic">
                                Sist oppdatert: 20. januar 2026
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <DialogTrigger asChild>
                        <Button variant="outline">Lukk</Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}
