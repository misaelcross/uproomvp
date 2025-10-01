import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function Devtools() {
  if (import.meta.env.DEV) {
    return <ReactQueryDevtools initialIsOpen={false} />;
  }
  return null;
}
