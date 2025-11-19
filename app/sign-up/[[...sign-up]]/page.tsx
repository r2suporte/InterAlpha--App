import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
            <SignUp
                appearance={{
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'shadow-2xl',
                        headerTitle: 'text-2xl font-bold',
                        headerSubtitle: 'text-gray-600',
                        socialButtonsBlockButton: 'border-2 hover:bg-gray-50',
                        formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
                        footerActionLink: 'text-indigo-600 hover:text-indigo-700',
                    },
                }}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignUpUrl="/dashboard"
            />
        </div>
    );
}
