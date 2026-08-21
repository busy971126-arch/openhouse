type AuthBrandHeroProps = {
  priority?: boolean;
};

export function AuthBrandHero(_props: AuthBrandHeroProps) {
  return (
    <div className="mb-9 border-b border-zinc-300 pb-5">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 bg-orange-600" />
        <h1 className="text-sm font-black tracking-[0.16em] text-zinc-950">OPENHOUSE</h1>
      </div>
      <p className="mt-3 text-[10px] font-bold tracking-[0.18em] text-zinc-400">
        FIND · JOIN · PLAY
      </p>
    </div>
  );
}
