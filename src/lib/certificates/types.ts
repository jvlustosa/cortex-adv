export type CertificatePublic = {
  code: string;
  recipientName: string;
  courseTitle: string;
  workloadHours: number;
  issuedAt: string;
  verifyUrl: string;
};

export type CertificateLookupResult =
  | { status: "valid"; certificate: CertificatePublic }
  | { status: "invalid"; code: string }
  | { status: "unconfigured" };
