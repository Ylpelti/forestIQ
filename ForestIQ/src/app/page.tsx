import { InvestmentEditor } from '../components/investment-editor';
export default function Home() {
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
    <p className="text-sm font-semibold tracking-widest">FORESTIQ</p>
    <h1 className="mt-4 text-3xl font-semibold">Metsäsijoituksen tuottoarvo</h1>
    <p className="mt-4">Muokkaa lähtötietoja ja hakkuuaikoja. Tuottoarvo, nettonykyarvo ja vuotuiset kassavirrat päivittyvät heti.</p>
    <InvestmentEditor />
  </main>;
}
