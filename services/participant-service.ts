
import { Participant, Language } from '../types';
import { LocalizationService } from './localization';

export class ParticipantService {
  /**
   * Determines if a name string refers to the "User" (the person being coached).
   */
  static isUser(name: string, lang: Language): boolean {
    const t = LocalizationService.getTranslations(lang);
    const lowercaseName = name.toLowerCase();
    const userTerms = [
      'you', 'user', 'me', 'coaché', 'coached', 'entrenado', 'usted', 
      t.youMention.toLowerCase(), 'utilisateur', 'moi', t.you.toLowerCase()
    ];
    return userTerms.some(term => lowercaseName.includes(term));
  }

  /**
   * Updates the list of participants based on new activity.
   * Ensures the Coached User is identified as the first speaker and correctly updated.
   */
  static getUpdatedParticipants(
    prev: Participant[], 
    speakerName: string, 
    category: string, 
    observation: string,
    lang: Language
  ): Participant[] {
    const t = LocalizationService.getTranslations(lang);
    const isGeneric = this.isGenericTerm(speakerName, lang);
    const displayName = isGeneric ? t.you : speakerName;
    const identifiedAsUser = this.isUser(speakerName, lang);

    // If no participants exist, the first detected speaker is always the Coached User.
    if (prev.length === 0) {
      return [{
        id: 'user',
        name: displayName,
        isUser: true,
        status: 'speaking' as const,
        lastEmotion: category === 'emotion' || category === 'tone' ? observation : undefined
      }];
    }

    // 1. Try to find the existing User participant
    const userParticipant = prev.find(p => p.isUser);
    
    // 2. Try to find a participant by name match
    const nameMatch = prev.find(p => p.name.toLowerCase() === speakerName.toLowerCase());

    // Logic: If identified as User or if there's a match with the existing User
    if (identifiedAsUser && userParticipant) {
      return prev.map(p => {
        if (p.isUser) {
          // Update user name only if it's not generic, or if we want to enforce t.you for generic names
          let newName = p.name;
          
          if (!isGeneric) {
             // AI gave a specific name (e.g. "John"), update it.
             newName = speakerName;
          } else if (p.name === 'User' || p.name === 'Utilisateur' || p.name === 'Usuario') {
             // Legacy/Fallback: If current name is old generic, update to localized "Vous"/"You"
             newName = t.you;
          }

          return {
            ...p,
            name: newName,
            lastEmotion: category === 'emotion' || category === 'tone' ? observation : p.lastEmotion,
            status: 'speaking' as const
          };
        }
        return { ...p, status: 'idle' as const };
      });
    }

    // 3. If it matches an existing non-user participant
    if (nameMatch) {
      return prev.map(p => {
        if (p.id === nameMatch.id) {
          return {
            ...p,
            lastEmotion: category === 'emotion' || category === 'tone' ? observation : p.lastEmotion,
            status: 'speaking' as const
          };
        }
        return { ...p, status: 'idle' as const };
      });
    }

    // 4. Create new participant if no match found
    return [...prev.map(p => ({ ...p, status: 'idle' as const })), {
      id: Math.random().toString(36).substr(2, 5),
      name: displayName,
      isUser: false,
      status: 'speaking' as const,
      lastEmotion: category === 'emotion' || category === 'tone' ? observation : undefined
    }];
  }

  private static isGenericTerm(name: string, lang: Language): boolean {
    const t = LocalizationService.getTranslations(lang);
    const lowercase = name.toLowerCase();
    const generics = [
      'you', 'user', 'utilisateur', 'usted', 'moi',
      t.youMention.toLowerCase(), 
      t.you.toLowerCase()
    ];
    return generics.includes(lowercase);
  }
}
