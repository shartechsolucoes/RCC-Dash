export type ProfileLevel = "ROOT" | "COORDENACAO_GERAL" | "COORDENADOR" | "MEMBRO";

// Corresponde aos "Perfil IDs" do plano: Root=0, Coordenação Geral=1, Coordenador=2, Membro=3.
export const PROFILE_LEVEL_RANK: Record<ProfileLevel, number> = {
  ROOT: 0,
  COORDENACAO_GERAL: 1,
  COORDENADOR: 2,
  MEMBRO: 3,
};

export const MANAGEMENT_ROLES: ProfileLevel[] = ["ROOT", "COORDENACAO_GERAL", "COORDENADOR"];
export const ROOT_ROLES: ProfileLevel[] = ["ROOT"];
export const TOP_ROLES: ProfileLevel[] = ["ROOT", "COORDENACAO_GERAL"];
export const ALL_ROLES: ProfileLevel[] = ["ROOT", "COORDENACAO_GERAL", "COORDENADOR", "MEMBRO"];

export function hasAccess(profileLevel: string | null | undefined, allowed: ProfileLevel[]): boolean {
  if (!profileLevel) return false;
  return allowed.includes(profileLevel as ProfileLevel);
}
