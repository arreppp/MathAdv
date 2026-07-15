import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion'

describe('MultipleChoiceQuestion', () => {
  it('renders the prompt and all options', () => {
    render(<MultipleChoiceQuestion prompt="What is 2 + 2?" options={['3', '4', '5']} onAnswer={vi.fn()} />)

    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
  })

  it('calls onAnswer with the selected option', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<MultipleChoiceQuestion prompt="What is 2 + 2?" options={['3', '4', '5']} onAnswer={onAnswer} />)

    await user.click(screen.getByRole('button', { name: '4' }))

    expect(onAnswer).toHaveBeenCalledWith('4')
  })

  it('disables all options when disabled is true', () => {
    render(<MultipleChoiceQuestion prompt="What is 2 + 2?" options={['3', '4']} onAnswer={vi.fn()} disabled />)

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
