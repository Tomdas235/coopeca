export default function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="alert alert-error">
      {message}
    </div>
  )
}