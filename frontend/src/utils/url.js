export const resolveFileUrl = (url) => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.startsWith('http://localhost:5000')) {
      const dynamicHost =
        typeof window !== 'undefined' && window.location.hostname
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';
      return url.replace('http://localhost:5000', dynamicHost);
    }
    return url;
  }

  const baseUrl =
    typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:5000`
      : 'http://localhost:5000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
