export default async () => {
  return new Response(
    JSON.stringify({ message: "Hello from Bun + Netlify!" }),
    { status: 200 }
  );
};
