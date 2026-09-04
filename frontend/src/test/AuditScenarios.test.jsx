import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/useAuth';
import { AuthModal } from '../components/auth/AuthModal';
import { UserProfileModal } from '../components/profile/UserProfileModal';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { DashboardPage } from '../pages/DashboardPage';
import { notesApi, authApi } from '../services/api';

// Helper component to trigger AuthContext methods
const TestAuthTrigger = () => {
  const { openAuthModal, openProfileModal, user } = useAuth();
  return (
    <div>
      <button onClick={() => openAuthModal('signup')}>Open Signup</button>
      <button onClick={() => openAuthModal('login')}>Open Login</button>
      <button onClick={openProfileModal}>Open Profile</button>
      <span data-testid="auth-user">{user ? user.name : 'Guest'}</span>
    </div>
  );
};

const renderWithProviders = (ui) => {
  return render(
    <ToastProvider>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </ToastProvider>
  );
};

describe('Frontend UI & Feedback Verification Audit', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('verifies client validation in AuthModal', async () => {
    renderWithProviders(
      <>
        <TestAuthTrigger />
        <AuthModal />
      </>
    );

    fireEvent.click(screen.getByText('Open Signup'));
    expect(screen.getByText('Create an account.')).toBeTruthy();

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    const form = submitBtn.closest('form');

    // Enter name only
    const nameInput = screen.getByPlaceholderText('Ahtisham Tahir');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    // Enter invalid email
    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Enter short password
    const pwInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(pwInput, { target: { value: '123' } });

    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    });

    // Fix email to have @ but no dot
    fireEvent.change(emailInput, { target: { value: 'invalid@email' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeTruthy();
    });

    // Fix email to valid, but keep password short
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy();
    });
  });

  it('verifies post-registration success feedback toast is displayed', async () => {
    vi.spyOn(authApi, 'signup').mockResolvedValueOnce({
      success: true,
      token: 'fake_jwt_token',
      user: { id: 'u1', name: 'John Doe', email: 'john@example.com', created_at: '2026-09-04T12:00:00Z' }
    });

    renderWithProviders(
      <>
        <TestAuthTrigger />
        <AuthModal />
      </>
    );

    fireEvent.click(screen.getByText('Open Signup'));

    fireEvent.change(screen.getByPlaceholderText('Ahtisham Tahir'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123' } });

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      // Modal closes
      expect(screen.queryByText('Create an account.')).toBeNull();
      // User is logged in
      expect(screen.getByTestId('auth-user').textContent).toBe('John Doe');
      // Toast element is now rendered!
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText(/Account created successfully! Welcome to NotionFlow, John Doe/i)).toBeTruthy();
    });
  });

  it('tests NoteCard handles undefined dates cleanly without Invalid Date', () => {
    const noteWithNoDates = {
      id: 'n1',
      title: 'Note without timestamps',
      content: 'Some test content',
      category: 'Ideas'
    };

    render(
      <NoteCard
        note={noteWithNoDates}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    // It should render 'Recently' instead of literal 'Invalid Date'
    expect(screen.queryByText('Invalid Date')).toBeNull();
    expect(screen.getByText('Recently')).toBeTruthy();
  });

  it('tests NoteCard properly decodes HTML entities', () => {
    const noteWithEntities = {
      id: 'n2',
      title: 'Entities Test',
      content: '<p>React &amp; Vite are fast &gt; Webpack &lt;3</p>',
      category: 'General',
      created_at: '2026-09-01T12:00:00Z'
    };

    render(
      <NoteCard
        note={noteWithEntities}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
      />
    );

    // HTML entities should be decoded: &amp; -> &, &gt; -> >, &lt; -> <
    expect(screen.getByText(/React & Vite are fast > Webpack <3/)).toBeTruthy();
  });

  it('tests DashboardPage note deletion with custom modal and toast feedback', async () => {
    const mockNotes = [
      {
        id: 'note_1',
        title: 'Original Title',
        content: '<p>Original Content</p>',
        category: 'Work',
        is_pinned: false,
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z'
      }
    ];

    vi.spyOn(notesApi, 'getAll').mockResolvedValue({ success: true, count: 1, notes: mockNotes });
    vi.spyOn(notesApi, 'delete').mockResolvedValue({ success: true, message: 'Note deleted successfully.' });

    renderWithProviders(<DashboardPage />);

    // Wait for notes to load
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeTruthy();
    });

    // Delete note button clicked
    const deleteBtn = screen.getByTitle('Delete note');
    fireEvent.click(deleteBtn);

    // Verify custom confirmation modal appears (instead of window.confirm)
    expect(screen.getByText('Delete this note?')).toBeTruthy();
    expect(screen.getByText(/Are you sure you want to permanently delete/)).toBeTruthy();

    // Click confirm delete in modal
    const confirmDeleteBtn = screen.getByText('Delete Note');
    fireEvent.click(confirmDeleteBtn);

    // Wait for note to be deleted from state
    await waitFor(() => {
      expect(screen.queryByText('Original Title')).toBeNull();
      // Toast confirms deletion
      expect(screen.getByText('Note deleted successfully.')).toBeTruthy();
    });
  });

  it('verifies clicking outside NoteEditorModal does NOT close the modal', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    const { container } = renderWithProviders(
      <NoteEditorModal
        isOpen={true}
        noteToEdit={null}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Create New Note.')).toBeTruthy();

    // Click on modal-overlay (outside the modal content)
    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    // Verify onClose was NOT triggered
    expect(handleClose).not.toHaveBeenCalled();

    // Verify Cancel button DOES trigger onClose
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('verifies UserProfileModal allows editing name and changing password', async () => {
    localStorage.setItem('notionflow_token', 'mock_token');
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      success: true,
      user: {
        id: 'u_test',
        name: 'Initial Name',
        email: 'editor@example.com',
        created_at: '2026-09-01T12:00:00Z'
      }
    });

    const updateProfileSpy = vi.spyOn(authApi, 'updateProfile').mockImplementation(async (data) => {
      return {
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: 'u_test',
          name: data.name || 'Initial Name',
          email: 'editor@example.com',
          created_at: '2026-09-01T12:00:00Z'
        }
      };
    });

    renderWithProviders(
      <>
        <TestAuthTrigger />
        <UserProfileModal />
      </>
    );

    // Wait for session to restore
    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Initial Name');
    });

    // Open profile modal
    fireEvent.click(screen.getByText('Open Profile'));
    expect(screen.getByText('Account Settings')).toBeTruthy();

    // 1. Edit Name
    const nameInput = screen.getByLabelText(/display name/i);
    expect(nameInput.value).toBe('Initial Name');

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Ahtisham Tahir' } });
    const saveNameBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveNameBtn.disabled).toBe(false);

    fireEvent.submit(saveNameBtn.closest('form'));

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalledWith({ name: 'Ahtisham Tahir' });
      expect(screen.getByText('Name updated successfully!')).toBeTruthy();
      expect(screen.getByTestId('auth-user').textContent).toBe('Ahtisham Tahir');
    });

    // 2. Switch to Security & Password Tab
    const securityTabBtn = screen.getByRole('button', { name: /security & password/i });
    fireEvent.click(securityTabBtn);

    expect(screen.getByText(/change password/i)).toBeTruthy();

    const currentPwInput = screen.getByLabelText(/current password/i);
    const newPwInput = screen.getByLabelText(/^new password/i);
    const confirmPwInput = screen.getByLabelText(/confirm new password/i);

    // Test password mismatch error
    fireEvent.change(currentPwInput, { target: { value: 'OldSecret123' } });
    fireEvent.change(newPwInput, { target: { value: 'NewSecret123' } });
    fireEvent.change(confirmPwInput, { target: { value: 'MismatchSecret123' } });

    const updatePwBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.submit(updatePwBtn.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('New passwords do not match.')).toBeTruthy();
    });

    // Fix mismatch
    fireEvent.change(confirmPwInput, { target: { value: 'NewSecret123' } });
    fireEvent.submit(updatePwBtn.closest('form'));

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalledWith({
        currentPassword: 'OldSecret123',
        newPassword: 'NewSecret123'
      });
      expect(screen.getByText('Password changed successfully!')).toBeTruthy();
    });
  });

  it('verifies clicking outside UserProfileModal does NOT close it', async () => {
    localStorage.setItem('notionflow_token', 'mock_token');
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      success: true,
      user: {
        id: 'u_test2',
        name: 'Persistent User',
        email: 'persistent@example.com',
        created_at: '2026-09-01T12:00:00Z'
      }
    });

    const { container } = renderWithProviders(
      <>
        <TestAuthTrigger />
        <UserProfileModal />
      </>
    );

    // Wait for session
    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Persistent User');
    });

    // Open profile
    fireEvent.click(screen.getByText('Open Profile'));
    expect(screen.getByText('Account Settings')).toBeTruthy();

    // Switch to Security & Password tab
    const securityTab = screen.getByRole('button', { name: /security & password/i });
    fireEvent.click(securityTab);
    expect(screen.getByText(/change password/i)).toBeTruthy();

    // Click outside on the modal-overlay
    const overlay = container.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.click(overlay);

    // Modal should still remain open
    expect(screen.getByText('Account Settings')).toBeTruthy();
    expect(screen.getByText(/change password/i)).toBeTruthy();

    // Click the dedicated Close button
    const closeBtn = screen.getByLabelText(/close profile modal/i);
    fireEvent.click(closeBtn);

    // Modal should now be closed
    await waitFor(() => {
      expect(screen.queryByText('Account Settings')).toBeNull();
    });
  });
});
