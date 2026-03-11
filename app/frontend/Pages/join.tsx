import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Html5Qrcode } from 'html5-qrcode';
import { Camera } from 'lucide-react';

import { Button } from '@cctv/core/Button/Button';
import { useGet } from '@cctv/hooks/useGet';
import { useJoinExperience } from '@cctv/hooks/useJoinExperience';

import styles from './Join.module.scss';

const SESSION_KEY = 'cctv_last_join_code';

function extractCodeFromQr(text: string): string {
  try {
    const url = new URL(text);
    const codeParam = url.searchParams.get('code');
    if (codeParam) return codeParam.toUpperCase();
    const pathMatch = url.pathname.match(/\/experiences\/([^/]+)/);
    if (pathMatch) return pathMatch[1].toUpperCase();
  } catch {
    // not a URL
  }
  return text.trim().toUpperCase();
}

interface RegistrationInfoResponse {
  type: 'success' | 'error';
  experience?: {
    name: string;
    code: string;
    code_slug: string;
    description?: string;
    join_open: boolean;
  };
  error?: string;
}

export default function Join() {
  const [searchParams] = useSearchParams();
  const slugFromUrl = searchParams.get('code');
  const savedCode = sessionStorage.getItem(SESSION_KEY) || '';
  const [code, setCode] = useState(slugFromUrl || savedCode);
  const [scanning, setScanning] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const { data: registrationInfo } = useGet<RegistrationInfoResponse>({
    url: `/api/experiences/${slugFromUrl}/registration_info`,
    enabled: !!slugFromUrl,
  });

  const { joinExperience, isLoading, error, setError } = useJoinExperience();

  const actualCode = code || registrationInfo?.experience?.code || '';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await joinExperience(actualCode);
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase());
    if (error) setError('');
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // already stopped
      }
      try {
        scannerRef.current.clear();
      } catch {
        // already cleared
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!readerRef.current || scannerRef.current) return;

    const scanner = new Html5Qrcode(readerRef.current.id);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 200 },
        (decodedText) => {
          const extracted = extractCodeFromQr(decodedText);
          setCode(extracted);
          stopScanner();
        },
        () => {},
      );
      setScanning(true);
    } catch {
      try {
        scanner.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setScanning(false);
      setCameraSupported(false);
    }
  }, [stopScanner]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <section className="page flex-centered">
      <div className={styles.header}>
        {registrationInfo?.experience?.name && <p>{registrationInfo.experience.name}</p>}
        <p>Enter the secret code:</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Secret Code"
          value={actualCode}
          onChange={handleCodeChange}
          disabled={isLoading}
          maxLength={50}
          autoCapitalize="characters"
          style={{ textTransform: 'uppercase' }}
        />
        {error && <p className={`error-message ${styles.error}`}>{error}</p>}
        <Button
          className="join-submit"
          type="submit"
          loading={isLoading}
          loadingText="Joining..."
          disabled={!actualCode.trim()}
        >
          Submit
        </Button>
      </form>

      {cameraSupported && (
        <div className={styles.qrSection}>
          <div id="qr-reader" ref={readerRef} className={scanning ? styles.qrReader : ''} />
          {scanning ? (
            <Button type="button" onClick={stopScanner}>
              Stop Scanner
            </Button>
          ) : (
            <button type="button" className={styles.qrButton} onClick={startScanner}>
              <Camera size={18} />
              Scan QR Code
            </button>
          )}
        </div>
      )}
    </section>
  );
}
