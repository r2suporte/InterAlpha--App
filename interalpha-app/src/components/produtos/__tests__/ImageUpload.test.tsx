import { describe, it, expect, vi, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageUpload from '../ImageUpload'

// Mock fetch
global.fetch = jest.fn()

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upload area', () => {
    render(<ImageUpload />)
    
    expect(screen.getByText(/clique ou arraste uma imagem aqui/i)).toBeInTheDocument()
    expect(screen.getByText(/selecionar arquivo/i)).toBeInTheDocument()
  })

  it('should show initial image when provided', () => {
    render(<ImageUpload initialImageUrl="/test-image.jpg" />)
    
    expect(screen.getByAltText(/preview da imagem/i)).toBeInTheDocument()
  })

  it('should validate file type', async () => {
    const onImageChange = jest.fn()
    render(<ImageUpload onImageChange={onImageChange} />)
    
    const fileInput = screen.getByRole('button', { name: /selecionar arquivo/i })
      .closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Arquivo inválido
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })
    
    await waitFor(() => {
      expect(screen.getByText(/tipo de arquivo não suportado/i)).toBeInTheDocument()
    })
  })

  it('should validate file size', async () => {
    render(<ImageUpload maxSize={1024} />) // 1KB limit
    
    const fileInput = screen.getByRole('button', { name: /selecionar arquivo/i })
      .closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Arquivo muito grande
    const largeFile = new File(['x'.repeat(2048)], 'large.jpg', { type: 'image/jpeg' })
    Object.defineProperty(largeFile, 'size', { value: 2048 })
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } })
    
    await waitFor(() => {
      expect(screen.getByText(/arquivo muito grande/i)).toBeInTheDocument()
    })
  })

  it('should upload file successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        imageUrl: '/uploads/test.jpg',
        fileName: 'test.jpg'
      }
    }
    
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)
    
    const onImageChange = jest.fn()
    render(<ImageUpload onImageChange={onImageChange} />)
    
    const fileInput = screen.getByRole('button', { name: /selecionar arquivo/i })
      .closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [validFile] } })
    
    // Aguardar upload
    await waitFor(() => {
      expect(screen.getByText(/enviando imagem/i)).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.getByText(/imagem enviada com sucesso/i)).toBeInTheDocument()
    })
    
    expect(onImageChange).toHaveBeenCalledWith('/uploads/test.jpg', 'test.jpg')
  })

  it('should handle upload error', async () => {
    const mockResponse = {
      success: false,
      error: 'Upload failed'
    }
    
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockResponse)
    } as Response)
    
    render(<ImageUpload />)
    
    const fileInput = screen.getByRole('button', { name: /selecionar arquivo/i })
      .closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [validFile] } })
    
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })
  })

  it('should remove image', async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true
    } as Response)
    
    const onImageChange = jest.fn()
    render(
      <ImageUpload 
        initialImageUrl="/test-image.jpg" 
        onImageChange={onImageChange}
      />
    )
    
    const removeButton = screen.getByRole('button', { name: /remover/i })
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalledWith(null)
    })
  })

  it('should handle drag and drop', async () => {
    const mockResponse = {
      success: true,
      data: {
        imageUrl: '/uploads/test.jpg',
        fileName: 'test.jpg'
      }
    }
    
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)
    
    render(<ImageUpload />)
    
    const dropArea = screen.getByText(/clique ou arraste uma imagem aqui/i).closest('div')
    
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // Simular drag over
    fireEvent.dragOver(dropArea!, {
      dataTransfer: { files: [validFile] }
    })
    
    // Simular drop
    fireEvent.drop(dropArea!, {
      dataTransfer: { files: [validFile] }
    })
    
    await waitFor(() => {
      expect(screen.getByText(/enviando imagem/i)).toBeInTheDocument()
    })
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ImageUpload disabled={true} />)
    
    const fileInput = screen.getByRole('button', { name: /selecionar arquivo/i })
      .closest('div')?.querySelector('input[type="file"]') as HTMLInputElement
    
    expect(fileInput).toBeDisabled()
  })

  it('should not show preview when showPreview is false', () => {
    render(
      <ImageUpload 
        initialImageUrl="/test-image.jpg" 
        showPreview={false}
      />
    )
    
    expect(screen.queryByAltText(/preview da imagem/i)).not.toBeInTheDocument()
    expect(screen.getByText(/clique ou arraste uma imagem aqui/i)).toBeInTheDocument()
  })
})