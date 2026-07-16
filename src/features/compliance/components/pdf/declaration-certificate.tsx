"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Register fonts if needed (using default Helvetica for now for simplicity/compatibility)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#10b981", // Emerald-500
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  label: {
    width: "40%",
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "bold",
  },
  value: {
    width: "60%",
    fontSize: 10,
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  signatureBox: {
    marginTop: 50,
    alignSelf: "flex-end",
    width: 200,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    textAlign: "center",
  },
  verifiedBadge: {
    position: "absolute",
    top: 200,
    right: 40,
    transform: "rotate(-15deg)",
    opacity: 0.2,
    color: "#10b981",
    fontSize: 40,
    fontWeight: "bold",
    borderWidth: 4,
    borderColor: "#10b981",
    padding: 10,
    borderRadius: 8,
  },
});

interface DeclarationCertificateProps {
  id: string;
  period: string;
  ecoOrganism: string;
  tonnage: number;
  amount: number;
  date: string;
  companyName: string;
}

export const DeclarationCertificate = ({ data }: { data: DeclarationCertificateProps }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logo}>KLOVER</Text>
        <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 10 }}>Certificat Officiel de Déclaration</Text>
      </View>

      <Text style={styles.title}>Attestation de Conformité</Text>
      <Text style={styles.subtitle}>
        Ce document certifie la déclaration des mises en marché pour la période spécifiée ci-dessous.
      </Text>

      <View style={styles.verifiedBadge}>
        <Text>CONFORME</Text>
      </View>

      <View style={{ marginTop: 20, marginBottom: 20 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Référence Déclaration :</Text>
          <Text style={styles.value}>{data.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Période :</Text>
          <Text style={styles.value}>{data.period}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date de soumission :</Text>
          <Text style={styles.value}>{data.date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Entreprise :</Text>
          <Text style={styles.value}>{data.companyName}</Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10, color: "#10b981" }}>
          Détails de la Contribution
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Éco-organisme :</Text>
          <Text style={styles.value}>{data.ecoOrganism}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tonnage Total Déclaré :</Text>
          <Text style={styles.value}>{data.tonnage.toLocaleString("fr-FR")} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Montant Estimé :</Text>
          <Text style={styles.value}>
            {data.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </Text>
        </View>
      </View>

      <View style={styles.signatureBox}>
        <View style={styles.signatureLine} />
        <Text style={styles.signatureText}>Signature Certifiée Klover</Text>
      </View>

      <View style={styles.footer}>
        <Text>
          Ce document est généré automatiquement par la plateforme Klover. Il atteste de l'enregistrement des données
          dans notre système sécurisé.
          {"\n"}
          Klover SAS - 12 Rue de la Paix, 75002 Paris - SIRET 123 456 789 00012
        </Text>
      </View>
    </Page>
  </Document>
);
