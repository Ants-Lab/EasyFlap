Fonctions du Arduino :

- Communiquer avec les volets
- Communiquer avec la télécommande
- Utilisation librairie Mirf

Algorithme :

Programme
{
	
	Variables:
		int CE_PIN -> 8
		int CSN_PIN -> 7
		int CANAL -> 42
		int PAYLOAD -> 12


	Serial.Initialisation -> 9600
	
	Mirf.DefinirCePin -> CE_PIN
	Mirf.DefinirCsnPin -> CSN_PIN
	Mirf.DefinirSpi -> &MirfHardwareSpi
	Mirf.Initialisation
	
	Mirf.DefinirCanal ->CANAL
	Mirf.DefinirPayload -> PAYLOAD
	Mirf.Config
	Mirf.DefinirAdresse -> "flbox"
	
	
	Tant que (Vrai)
	{
		
		Si (Serial.DonnéeDisponible)
		{
			//Lire l'adresse du volet sur le port usb
			byte[5] adresseVoletByte
			adresseVoletByte -> Serial.Lire(adresseVolet.Taille)
			
			//Convertir l'adresse vers un tableau de char
			char[5] adresseVoletChar
			Pour(i allant de 0 à 4)
			{
				adresseVoletChar[i] -> (char)adresseVoletByte[i]
			}
			
			//Configurer l'adresse du volet pour l'envoi de données
			Mirf.DefinirAdresseRecepteur(adresseVoletChar)
			
			//Lire le reste les données
			byte[Mirf.Payload] donnees
			donnees -> Serial.Lire(donnees.Taille)
			
			//Envoi des données vers le volet
			Mirf.Envoyer(donnees)
			
			//Attente de l'envoi
			Tant que (Mirf.EnTrainEnvoi) { }	
		}
		
		Si (!Mirf.EnTrainEnvoi ET Mirf.DonneesDisponibles)
		{
			//Recevoir les donnees
			byte[Mirf.Payload] donnees
			donnees -> Mirf.RecevoirDonnees
			
			//Ecrire sur le port usb
			Serial.Ecrire(donnees, donnees.Taille)
		}
		
		
		
	}

}