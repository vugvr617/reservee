export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 lg:flex-[0.55] flex items-center justify-center p-8 bg-gradient-to-br from-white to-lime-50/30">
        <div className="w-full max-w-lg">{children}</div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-[0.45] bg-[#0a0a0a] text-white relative">
        <div className="sticky top-0 h-screen w-full p-12 flex flex-col justify-between overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large R lettermark background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-[300px] font-bold text-lime-400/10 select-none">
              R
            </span>
          </div>
          {/* Lime accent glow */}
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl" />
          {/* Diagonal accent lines with lime */}
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-lime-400/30 to-transparent transform rotate-45 translate-x-32" />
          <div className="absolute bottom-0 right-0 w-px h-96 bg-gradient-to-t from-lime-400/40 to-transparent transform -rotate-45" />
        </div>

        {/* Content */}
        <div className="relative z-10 mt-32">
          <h1 className="text-4xl font-semibold mb-4">Welcome to Reservee</h1>
          <p className="text-gray-400 max-w-sm">
            AI-powered call bot for restaurant reservations. Manage your
            bookings, configure your bot, and track analytics all in one place.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Join restaurants worldwide using Reservee
          </p>
        </div>

        {/* Bottom card */}
        <div className="relative z-10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 border border-lime-400/20">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-medium">
              Automate your reservations
            </h3>
            <div className="w-10 h-10 bg-lime-400/10 rounded-lg flex items-center justify-center">
              <span className="text-lime-400 text-lg">✓</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Let AI handle your phone calls while you focus on what matters most
            - your guests.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
