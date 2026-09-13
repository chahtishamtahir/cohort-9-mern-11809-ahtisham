import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../src/context/ToastContext';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/useAuth';
import { AuthModal } from '../src/components/auth/AuthModal';
import { UserProfileModal } from '../src/components/profile/UserProfileModal';
import { NoteCard } from '../src/components/notes/NoteCard';
import { NoteEditorModal } from '../src/components/notes/NoteEditorModal';
import { DashboardPage } from '../src/pages/DashboardPage';
import { notesApi, authApi } from '../src/services/api';
import { htmlToMarkdown } from '../src/utils/markdownUtils';

// Helper component to trigger AuthContext methods
const TestAuthTrigger = () => {
  const { openAuthModal, openProfileModal, user, signup } = useAuth();
  return (
    <div>
      <button onClick={() => openAuthModal('signup')}>Open Signup</button>
      <button onClick={() => openAuthModal('login')}>Open Login</button>
      <button onClick={openProfileModal}>Open Profile</button>
      <button onClick={() => signup('Fresh Account', 'goodbye@example.com', 'Pass123!')}>Direct Signup</button>
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

  it('verifies AuthModal clears errors and passwords when switching between login and signup', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValueOnce(new Error('Invalid email or password.'));

    renderWithProviders(
      <>
        <TestAuthTrigger />
        <AuthModal />
      </>
    );

    // Open Login
    fireEvent.click(screen.getByText('Open Login'));
    expect(screen.getByText('Log in to NotionFlow.')).toBeTruthy();

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const pwInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    // Enter login info
    fireEvent.change(emailInput, { target: { value: 'abc1@gmail.com' } });
    fireEvent.change(pwInput, { target: { value: 'wrongsecret' } });
    fireEvent.submit(submitBtn.closest('form'));

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeTruthy();
    });

    // Switch to Signup mode via switcher button
    const signUpSwitchBtn = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(signUpSwitchBtn);

    // Verify switched to Create Account
    expect(screen.getByText('Create an account.')).toBeTruthy();

    // Verify error banner is now GONE
    expect(screen.queryByText('Invalid email or password.')).toBeNull();

    // Verify password is reset, while email is preserved for user convenience
    expect(screen.getByPlaceholderText('••••••••').value).toBe('');
    expect(screen.getByPlaceholderText('you@example.com').value).toBe('abc1@gmail.com');
  });

  it('verifies NoteCard highlights search query keywords in title and body', () => {
    const note = {
      id: 'n_search_1',
      title: 'Summer Lake District Trip',
      content: '<p>Confirm packing list and express train tickets for Summer.</p>',
      category: 'Travel'
    };

    const { container } = render(
      <NoteCard
        note={note}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onTogglePin={vi.fn()}
        searchQuery="Summer"
      />
    );

    // Verify <mark class="search-highlight"> is rendered for matching keyword
    const marks = container.querySelectorAll('mark.search-highlight');
    expect(marks.length).toBeGreaterThanOrEqual(2);
    expect(marks[0].textContent).toBe('Summer');
  });

  it('verifies NoteEditorModal supports custom categories and draft persistence', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    const handleAutoSave = vi.fn().mockResolvedValue(true);

    render(
      <NoteEditorModal
        isOpen={true}
        noteToEdit={null}
        onClose={vi.fn()}
        onSave={handleSave}
        onAutoSave={handleAutoSave}
        existingCategories={['Travel', 'Recipes']}
      />
    );

    // Verify modal title
    expect(screen.getByText('Create New Note.')).toBeTruthy();

    // Click "+ Custom" button to toggle custom category mode
    const customBtn = screen.getByRole('button', { name: /\+ custom/i });
    fireEvent.click(customBtn);

    // Type a new custom tag
    const customTagInput = screen.getByPlaceholderText(/e\.g\. Travel, Recipes/i);
    fireEvent.change(customTagInput, { target: { value: 'Fitness' } });

    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);

    // Fill in title
    const titleInput = screen.getByPlaceholderText(/e\.g\., Q3 Product Roadmap/i);
    fireEvent.change(titleInput, { target: { value: 'Marathon Training' } });

    // Submit note
    const submitBtn = screen.getByRole('button', { name: /create note/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Marathon Training',
          category: 'Fitness'
        })
      );
    });
  });

  it('verifies NoteEditorModal auto-saves only when dirty and does not loop infinitely', async () => {
    const handleAutoSave = vi.fn().mockResolvedValue(true);
    const existingNote = {
      id: 'note-123',
      title: 'Original Title',
      content: '<p>Original Content</p>',
      category: 'Work',
      is_pinned: false
    };

    const { rerender } = render(
      <NoteEditorModal
        isOpen={true}
        noteToEdit={existingNote}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onAutoSave={handleAutoSave}
        existingCategories={['Work']}
      />
    );

    // Initial render should NOT trigger auto-save
    expect(handleAutoSave).not.toHaveBeenCalled();

    // Change title
    const titleInput = screen.getByPlaceholderText(/e\.g\., Q3 Product Roadmap/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Should indicate auto-saving
    expect(screen.getByText(/Auto-saving\.\.\./i)).toBeTruthy();

    // Wait for debounced auto-save to execute
    await waitFor(() => {
      expect(handleAutoSave).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });

    // Rerender with new callback reference (simulating parent re-render on save)
    const newHandleAutoSave = vi.fn().mockResolvedValue(true);
    rerender(
      <NoteEditorModal
        isOpen={true}
        noteToEdit={existingNote}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onAutoSave={newHandleAutoSave}
        existingCategories={['Work']}
      />
    );

    // Should NOT trigger auto-save again because data is not dirty
    expect(newHandleAutoSave).not.toHaveBeenCalled();
  });

  it('verifies htmlToMarkdown correctly converts HTML content into clean markdown for export', () => {
    const html = '<h2>Meeting Notes</h2><p>Discuss <strong>budget</strong> and <code>API keys</code>.</p><ul><li>Task 1</li><li>Task 2</li></ul>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('## Meeting Notes');
    expect(md).toContain('**budget**');
    expect(md).toContain('`API keys`');
    expect(md).toContain('- Task 1');
    expect(md).toContain('- Task 2');
  });

  it('verifies NoteEditorModal defaults category to defaultCategory when creating a note from a filtered tag view', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);
    render(
      <NoteEditorModal
        isOpen={true}
        defaultCategory="Study"
        onClose={vi.fn()}
        onSave={handleSave}
        onAutoSave={vi.fn()}
      />
    );

    // The category dropdown should default to Study
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('Study');

    // Fill title and save
    const titleInput = screen.getByPlaceholderText(/e\.g\., Q3 Product Roadmap/i);
    fireEvent.change(titleInput, { target: { value: 'Calculus Notes' } });

    const submitBtn = screen.getByRole('button', { name: /create note/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Calculus Notes',
          category: 'Study'
        })
      );
    });
  });

  it('verifies NoteEditorModal defaults to General when defaultCategory is All or unspecified', () => {
    const { unmount } = render(
      <NoteEditorModal
        isOpen={true}
        defaultCategory="All"
        onClose={vi.fn()}
        onSave={vi.fn()}
        onAutoSave={vi.fn()}
      />
    );

    const selectAll = screen.getByRole('combobox');
    expect(selectAll.value).toBe('General');
    unmount();

    render(
      <NoteEditorModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onAutoSave={vi.fn()}
      />
    );
    const selectNone = screen.getByRole('combobox');
    expect(selectNone.value).toBe('General');
  });

  it('verifies NoteEditorModal preserves existing note category when editing, even if defaultCategory is passed', () => {
    const existingNote = {
      id: 'note-456',
      title: 'Sprint Planning',
      content: '<p>Discussion</p>',
      category: 'Meeting',
      is_pinned: false
    };

    render(
      <NoteEditorModal
        isOpen={true}
        noteToEdit={existingNote}
        defaultCategory="Study"
        onClose={vi.fn()}
        onSave={vi.fn()}
        onAutoSave={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select.value).toBe('Meeting');
  });

  it('verifies Danger Zone and account deletion flow with password confirmation', async () => {
    localStorage.setItem('notionflow_token', 'token_to_delete');
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      success: true,
      user: {
        id: 'user_delete_target',
        name: 'Account To Delete',
        email: 'goodbye@example.com',
        created_at: '2026-09-01T12:00:00Z',
        noteCount: 3
      }
    });

    const deleteAccountSpy = vi.spyOn(authApi, 'deleteAccount').mockImplementation(async (password) => {
      if (password === 'wrong_pw') {
        const error = new Error('Incorrect password. Account deletion cancelled.');
        error.status = 400;
        throw error;
      }
      return {
        success: true,
        message: 'Your account and all associated notes have been permanently deleted.'
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
      expect(screen.getByTestId('auth-user').textContent).toBe('Account To Delete');
    });

    // Open profile modal
    fireEvent.click(screen.getByText('Open Profile'));
    expect(screen.getByText('Account Settings')).toBeTruthy();

    // Switch to Danger Zone Tab
    const dangerTab = screen.getByRole('button', { name: /danger zone/i });
    fireEvent.click(dangerTab);
    expect(screen.getByText(/permanent account deletion/i)).toBeTruthy();
    expect(screen.getByText(/3 notes/i)).toBeTruthy();

    // Click "Delete NotionFlow Account..." button
    const deleteInitialBtn = screen.getByRole('button', { name: /delete notionflow account/i });
    fireEvent.click(deleteInitialBtn);

    // Confirmation form should appear
    const passwordInput = screen.getByLabelText(/confirm with password/i);
    expect(passwordInput).toBeTruthy();

    // Test error case (wrong password)
    fireEvent.change(passwordInput, { target: { value: 'wrong_pw' } });
    const confirmDeleteBtn = screen.getByRole('button', { name: /permanently delete/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeTruthy();
      expect(screen.getByTestId('auth-user').textContent).toBe('Account To Delete');
    });

    // Test success case (correct password)
    fireEvent.change(passwordInput, { target: { value: 'correct_password_123' } });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteAccountSpy).toHaveBeenCalledWith('correct_password_123');
      expect(localStorage.getItem('notionflow_token')).toBeNull();
      expect(screen.getByTestId('auth-user').textContent).toBe('Guest');
    });

    // Re-create account and verify profile modal opens fresh
    vi.spyOn(authApi, 'getMe').mockResolvedValue({
      success: true,
      user: {
        id: 'user_new_456',
        name: 'Fresh Account',
        email: 'goodbye@example.com',
        created_at: '2026-09-13T12:00:00Z',
        noteCount: 0
      }
    });
    vi.spyOn(authApi, 'signup').mockResolvedValue({
      success: true,
      token: 'fresh_token_456',
      user: {
        id: 'user_new_456',
        name: 'Fresh Account',
        email: 'goodbye@example.com'
      }
    });

    fireEvent.click(screen.getByText('Direct Signup'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-user').textContent).toBe('Fresh Account');
    });

    // Open profile modal again
    fireEvent.click(screen.getByText('Open Profile'));
    expect(screen.getByText('Account Settings')).toBeTruthy();

    // Verify it opens on Profile Details tab, NOT Danger Zone, with no leftover password
    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i).value).toBe('Fresh Account');
    });
    expect(screen.queryByLabelText(/confirm with password/i)).toBeNull();
  });
});
