import { AudiobookForm } from '../AudiobookForm';

export default function NewAudiobook() {
  return (
    <div>
      <h1>New Audiobook</h1>
      <div className="card">
        <AudiobookForm mode="new" />
      </div>
    </div>
  );
}
