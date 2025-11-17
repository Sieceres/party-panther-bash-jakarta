import { render, screen, waitFor } from '@testing-library/react';
import { InstagramEmbed } from '../InstagramEmbed';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('InstagramEmbed', () => {
  const mockUrl = 'https://www.instagram.com/p/ABC123/';
  const mockHtml = '<blockquote class="instagram-media"><div>Mock Instagram Post</div></blockquote>';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (supabase.functions.invoke as jest.Mock).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<InstagramEmbed url={mockUrl} />);
    expect(screen.getByText('Loading Instagram post...')).toBeInTheDocument();
  });

  it('renders embed HTML when API call succeeds', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { html: mockHtml, cached: false },
      error: null,
    });

    render(<InstagramEmbed url={mockUrl} />);

    await waitFor(() => {
      expect(screen.getByText('Mock Instagram Post')).toBeInTheDocument();
    });
  });

  it('renders fallback link when API call fails', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' },
    });

    render(<InstagramEmbed url={mockUrl} />);

    await waitFor(() => {
      const link = screen.getByText('View this post on Instagram');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', mockUrl);
    });
  });

  it('renders fallback link when no HTML returned', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { html: null },
      error: null,
    });

    render(<InstagramEmbed url={mockUrl} />);

    await waitFor(() => {
      const link = screen.getByText('View this post on Instagram');
      expect(link).toBeInTheDocument();
    });
  });

  it('normalizes URL by adding trailing slash', async () => {
    const urlWithoutSlash = 'https://www.instagram.com/p/ABC123';
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { html: mockHtml },
      error: null,
    });

    render(<InstagramEmbed url={urlWithoutSlash} />);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('instagram-oembed', {
        body: { url: `${urlWithoutSlash}/` },
      });
    });
  });

  it('shows debug info in non-production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Failed' },
    });

    render(<InstagramEmbed url={mockUrl} />);

    await waitFor(() => {
      expect(screen.getByText(/Debug:/)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockUrl))).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });
});
