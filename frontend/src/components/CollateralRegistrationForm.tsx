'use client';
import { useState, useEffect, useCallback } from 'react';
import { signTransaction } from '@/lib/freighterClient';
import { submitSignedXdr } from '@/lib/stellarUtils';
import ConfirmDialog from '@/components/ConfirmDialog';
import Spinner from '@/components/Spinner';
import { motion, useReducedMotion } from 'framer-motion';
import { submitVariants } from '@/lib/animations';
import { Input, Select, Button, ErrorSummary, toSummaryErrors } from '@/components/ui';
import { useToast } from '@/components/toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface Props {
  walletAddress: string;
  onSuccess?: (collateralId: string) => void;
}

interface FormData {
  animalType: string;
  quantity: string;
  weight: string;
  healthStatus: string;
  location: string;
  appraisedValue: string;
  breed: string;
  age: string;
  image: File | null;
}

interface FormErrors {
  animalType?: string;
  quantity?: string;
  weight?: string;
  healthStatus?: string;
  location?: string;
  appraisedValue?: string;
  breed?: string;
  age?: string;
  image?: string;
}

const ANIMAL_TYPES = ['cattle', 'goat', 'sheep'];
const HEALTH_STATUSES = ['excellent', 'good', 'fair', 'poor'];
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTO_SAVE_INTERVAL = 5000;
const STORAGE_KEY = 'stellarkraal_collateral_form';

const FIELD_IDS: Record<keyof FormErrors, string> = {
  animalType: 'reg-animal-type',
  quantity: 'reg-quantity',
  weight: 'reg-weight',
  healthStatus: 'reg-health-status',
  location: 'reg-location',
  appraisedValue: 'reg-appraised-value',
  breed: 'reg-breed',
  age: 'reg-age',
  image: 'reg-image',
};

export default function CollateralRegistrationForm({ walletAddress, onSuccess }: Props) {
  const reduced = useReducedMotion();
  const toast = useToast();
  const { isOnline } = useNetworkStatus();
  const [formData, setFormData] = useState<FormData>({
    animalType: 'cattle',
    quantity: '',
    weight: '',
    healthStatus: 'good',
    location: '',
    appraisedValue: '',
    breed: '',
    age: '',
    image: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.walletAddress === walletAddress && parsed.data) {
          setShowRestorePrompt(true);
        }
      } catch {
        // ignore
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.quantity || formData.weight || formData.location || formData.appraisedValue) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ walletAddress, data: formData, timestamp: new Date().toISOString() })
        );
        setLastSaved(new Date());
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [formData, walletAddress]);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const restoreSavedData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          setFormData(parsed.data);
          setShowRestorePrompt(false);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const dismissRestore = () => {
    setShowRestorePrompt(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const validateField = useCallback(
    (name: keyof FormData, value: string | File | null): string | undefined => {
      switch (name) {
        case 'breed':
          if (!value || (typeof value === 'string' && value.trim().length === 0))
            return 'Breed is required';
          if (typeof value === 'string' && value.trim().length < 2)
            return 'Breed must be at least 2 characters';
          break;
        case 'age': {
          if (!value || (typeof value === 'string' && value.trim().length === 0))
            return 'Age is required';
          const ageNum = parseInt(value as string);
          if (isNaN(ageNum) || ageNum < 0) return 'Age must be a valid number';
          break;
        }
        case 'image': {
          if (!value) return 'Image is required';
          if (value instanceof File) {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(value.type))
              return 'Only image files are allowed (JPEG, PNG, WebP, GIF)';
            if (value.size > 5 * 1024 * 1024) return 'Image must be smaller than 5MB';
          }
          break;
        }
        case 'quantity': {
          if (!value) return 'Quantity is required';
          const qty = parseInt(value as string);
          if (isNaN(qty) || qty <= 0) return 'Quantity must be a positive number';
          break;
        }
        case 'weight': {
          if (!value) return 'Estimated weight is required';
          const wt = parseFloat(value as string);
          if (isNaN(wt) || wt <= 0) return 'Weight must be a positive number';
          break;
        }
        case 'location':
          if (!value || (typeof value === 'string' && value.trim().length === 0))
            return 'Location is required';
          if (typeof value === 'string' && value.trim().length < 3)
            return 'Location must be at least 3 characters';
          break;
        case 'appraisedValue': {
          if (!value) return 'Appraised value is required';
          const val = parseInt(value as string);
          if (isNaN(val) || val <= 0) return 'Appraised value must be a positive number';
          break;
        }
      }
      return undefined;
    },
    []
  );

  const handleChange = (name: keyof FormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange('image', file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!validateForm()) return;
    setShowConfirm(true);
  };

  const registerCollateral = async () => {
    setLoading(true);
    try {
      // Build multipart/form-data so the image travels alongside the other fields
      const body = new FormData();
      body.append('owner', walletAddress);
      body.append('animal_type', formData.animalType);
      body.append('count', formData.quantity);
      body.append('appraised_value', formData.appraisedValue);
      if (imageFile) {
        body.append('image', imageFile, imageFile.name);
      }

      const res = await fetch(`${API}/api/v1/collateral/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: walletAddress,
          animal_type: formData.animalType,
          count: parseInt(formData.quantity),
          appraised_value: parseInt(formData.appraisedValue),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Registration failed');
      }
      const { xdr } = await res.json();
      const { signedTxXdr } = await signTransaction(xdr, {
        network: process.env.NEXT_PUBLIC_NETWORK || 'TESTNET',
      });
      const result = await submitSignedXdr(signedTxXdr);
      localStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
      setErrors({});
      setSubmitAttempted(false);
      onSuccess?.(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Registration failed');
      setStatus(`error:${e instanceof Error ? e.message : 'Registration failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const isError = status?.startsWith('error:');

  const handleCopy = () => {
    if (!successId) return;
    navigator.clipboard.writeText(successId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successId) {
    return (
      <FormSuccess
        title="Collateral Registered!"
        summary={
          <div className="flex flex-col items-center gap-2">
            <p>
              <span className="font-medium">Collateral ID:</span>{' '}
              <span data-testid="success-collateral-id">{successId}</span>
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Collateral ID copied' : 'Copy collateral ID'}
              className="text-xs underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--token-success,#16a34a)] rounded"
            >
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
        }
        onSubmitAnother={resetForm}
        viewDetailsHref={`/collateral/${successId}`}
        viewDetailsLabel="View Collateral"
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-4">
      {showRestorePrompt && (
        <div className="bg-gold-100 border border-gold-300 rounded-xl p-4">
          <p className="text-sm text-brown-700 mb-2">
            You have unsaved progress. Would you like to restore it?
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={restoreSavedData}>
              Restore
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissRestore}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-brown-700">Register Livestock Collateral</h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <ErrorSummary errors={submitAttempted ? toSummaryErrors(errors, FIELD_IDS) : []} />
        <Select
          id={FIELD_IDS.animalType}
          label="Animal Type"
          required
          value={formData.animalType}
          onChange={(e) => handleChange('animalType', e.target.value)}
          disabled={loading}
        >
          {ANIMAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </Select>

        <Input
          id={FIELD_IDS.quantity}
          label="Quantity"
          required
          type="number"
          placeholder="Number of animals"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          error={errors.quantity}
          disabled={loading}
        />

        <Input
          id={FIELD_IDS.weight}
          label="Estimated Weight (kg)"
          required
          type="number"
          step="0.1"
          placeholder="Average weight per animal"
          value={formData.weight}
          onChange={(e) => handleChange('weight', e.target.value)}
          error={errors.weight}
          disabled={loading}
        />

        <Select
          id={FIELD_IDS.healthStatus}
          label="Health Status"
          required
          value={formData.healthStatus}
          onChange={(e) => handleChange('healthStatus', e.target.value)}
          disabled={loading}
        >
          {HEALTH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>

        <Input
          id={FIELD_IDS.location}
          label="Location"
          required
          type="text"
          placeholder="Farm or region name"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          error={errors.location}
          disabled={loading}
        />

        <Input
          id={FIELD_IDS.appraisedValue}
          label="Appraised Value (stroops)"
          required
          type="number"
          placeholder="Total value in stroops"
          value={formData.appraisedValue}
          onChange={(e) => handleChange('appraisedValue', e.target.value)}
          error={errors.appraisedValue}
          disabled={loading}
        />

        <Input
          id={FIELD_IDS.breed}
          label="Breed"
          required
          type="text"
          placeholder="e.g., Holstein, Boer, Merino"
          value={formData.breed}
          onChange={(e) => handleChange('breed', e.target.value)}
          error={errors.breed}
          disabled={loading}
        />

        <Input
          id={FIELD_IDS.age}
          label="Age (years)"
          required
          type="number"
          placeholder="Age of the animal"
          value={formData.age}
          onChange={(e) => handleChange('age', e.target.value)}
          error={errors.age}
          disabled={loading}
        />

        <div className="space-y-2">
          <label
            htmlFor={FIELD_IDS.image}
            className="block text-sm font-medium text-brown-700 dark:text-cream-50"
          >
            Animal Photo <span className="text-error">*</span>
          </label>
          <input
            id={FIELD_IDS.image}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            className="block w-full text-sm text-brown-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-brown hover:file:bg-gold/80 disabled:opacity-50"
            aria-label="Upload animal photo"
          />
          {errors.image && <p className="text-sm text-error">{errors.image}</p>}
          {imagePreview && (
            <div className="mt-3 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-brown/10"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, image: null }));
                  setImagePreview(null);
                  setErrors((prev) => ({ ...prev, image: undefined }));
                }}
                className="absolute top-2 right-2 bg-error text-white rounded-full p-1 hover:bg-error/80"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          variants={reduced ? undefined : submitVariants}
          animate={loading ? 'loading' : 'idle'}
          className="w-full bg-brown text-cream py-2.5 rounded-xl font-semibold hover:bg-brown/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading || !isOnline}
          aria-disabled={loading || !isOnline}
          title={!isOnline ? "You're offline" : undefined}
        >
          {loading ? (
            <>
              <Spinner />
              Processing…
            </>
          ) : !isOnline ? (
            "You're offline"
          ) : (
            'Register Collateral'
          )}
        </motion.button>
      </form>

      {lastSaved && !loading && (
        <p className="text-xs text-brown-400 text-center">
          Auto-saved at {lastSaved.toLocaleTimeString()}
        </p>
      )}

      {status && (
        <div
          role="status"
          className={`p-3 rounded-xl text-sm ${
            isError ? 'bg-error-light text-error-dark' : 'bg-success-light text-success-dark'
          }`}
        >
          {isError ? status.replace('error:', '') : status}
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Register Collateral"
        message={`Register ${formData.quantity} ${formData.animalType}(s) with appraised value of ${formData.appraisedValue} stroops as on-chain collateral? This action cannot be undone.`}
        confirmLabel="Register"
        onConfirm={() => {
          setShowConfirm(false);
          registerCollateral();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
