type AuthBrandHeroProps = {
  priority?: boolean;
};

export function AuthBrandHero(_props: AuthBrandHeroProps) {
  return (
    <div className="mb-8">
      <h1 className="text-center text-3xl font-bold tracking-tight text-orange-600">
        OpenHouse
      </h1>
    </div>
  );
}
