/*
  # Add admin DELETE policy on users table

  1. Changes
    - Add "Admins can delete users" policy on the users table
    - This was the only missing CRUD policy across all 11 tables
    - Admins need this to manage/remove user accounts from the admin panel

  2. Security
    - Policy is restricted to authenticated users who are admins (is_admin = true)
    - Uses the standard admin check pattern: EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    - DELETE only requires USING clause (no WITH CHECK needed for deletes)
*/

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
