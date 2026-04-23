import { compactNum } from "../_lib/data";

type Props = {
  muertosTotal: number;
  heridosTotal: number;
  anoReferencia: string;
  fuenteVehiculos: string;
};

export function Hero({
  muertosTotal,
  heridosTotal,
  anoReferencia,
  fuenteVehiculos,
}: Props) {
  return (
    <section className="min-h-[90vh] flex flex-col justify-center max-w-6xl mx-auto px-6 py-24">
      <p className="text-sm tracking-[0.18em] uppercase text-accent-soft mb-6">
        Accidentalidad vial · Colombia
      </p>
      <h1 className="text-5xl md:text-7xl font-semibold leading-[1.02] tracking-tight max-w-4xl">
        Cada año en Colombia, miles de personas salen de casa y no vuelven.
      </h1>
      <p className="mt-10 text-lg md:text-xl text-foreground/70 max-w-2xl leading-relaxed">
        Una lectura de los datos abiertos de accidentes de tránsito, víctimas y
        comparendos — cruzados para entender quién, cuándo y por qué morimos en
        las vías.
      </p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl">
        <div>
          <div className="number-hero text-6xl md:text-7xl font-bold text-accent">
            {compactNum(muertosTotal)}
          </div>
          <div className="mt-2 text-sm text-foreground/60 uppercase tracking-wider">
            Personas muertas en vías · {anoReferencia}
          </div>
        </div>
        <div>
          <div className="number-hero text-6xl md:text-7xl font-bold text-foreground">
            {compactNum(heridosTotal)}
          </div>
          <div className="mt-2 text-sm text-foreground/60 uppercase tracking-wider">
            Personas heridas · {anoReferencia}
          </div>
        </div>
      </div>

      <p className="mt-16 text-xs text-muted max-w-2xl">
        Datos: {fuenteVehiculos}. Fuentes: RUNT (Ley 2251-2022), Policía
        Nacional, SIMIT-FCM y datos.gov.co.
      </p>
    </section>
  );
}
