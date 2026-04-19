import { AuthorForm } from '../AuthorForm';

export default function NewAuthorPage() {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>New Author</h1>
      <div className="card">
        <AuthorForm mode="new" />
      </div>
    </div>
  );
}
