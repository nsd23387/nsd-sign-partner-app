// src/hooks/useAdmin.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useAdminPartners() {
  const partners = useQuery(api.partners.list);
  return { partners: partners ?? [], loading: partners === undefined };
}

export function useUpdatePartner() {
  return useMutation(api.partners.update);
}

export function useCreatePartner() {
  return useMutation(api.partners.create);
}
