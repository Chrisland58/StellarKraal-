/**
 * Profile update validation schemas.
 */
import { z } from 'zod';

export const notificationPreferencesSchema = z
  .object({
    loanApproved: z.boolean().optional(),
    loanRepaid: z.boolean().optional(),
    liquidationWarning: z.boolean().optional(),
    loanDisbursed: z.boolean().optional(),
  })
  .optional();

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'displayName must be at least 2 characters').max(40, 'displayName must be at most 40 characters').optional(),
  notificationPreferences: notificationPreferencesSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserProfile {
  walletAddress: string;
  displayName?: string;
  notificationPreferences?: {
    loanApproved?: boolean;
    loanRepaid?: boolean;
    liquidationWarning?: boolean;
    loanDisbursed?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
