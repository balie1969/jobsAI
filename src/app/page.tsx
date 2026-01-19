import { AuthForm } from "@/components/auth-form";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero.png"
                    alt="Job AI Hero"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-white space-y-6 max-w-lg">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                        Finn din fremtid.
                    </h1>
                    <p className="text-xl text-gray-200">
                        AI-drevet jobbmatching som forstår dine ferdigheter og mål.
                        Slutt å lete, begynn å koble.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                            <span className="text-sm">Smart matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 rounded-full bg-blue-500"></span>
                            <span className="text-sm">Rask analyse</span>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md">
                    <AuthForm />
                </div>
            </div>
        </div>
    );
}
