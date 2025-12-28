import { Component,   OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import   { ActivatedRoute } from "@angular/router"
import { RouterModule } from "@angular/router"
import   { AnimalService } from "../../shared/services/animal.service"
import   { Pet } from "../../shared/models/pet.model"
import { AlertController } from "@ionic/angular"

@Component({
  selector: "app-view-animal",
  templateUrl: "./view-animal.page.html",
  styleUrls: ["./view-animal.page.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ViewAnimalPage implements OnInit {
  petInfo: Pet | null = null
  loading = false
  error: string | null = null

  constructor(
    private route: ActivatedRoute,
    private animalService: AnimalService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    // Get animal ID from route parameters
    const animalId = this.route.snapshot.paramMap.get("id")

    if (animalId) {
      this.loadAnimalData(animalId)
    } else {
      this.error = "ID de l'animal non fourni"
    }
  }

  loadAnimalData(id: string) {
    this.loading = true
    this.error = null

    this.animalService.getAnimalById(id).subscribe({
      next: (animal: Pet) => {
        this.petInfo = animal
        this.updatePetEmoji()
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading animal data:", error)
        this.error = "Erreur lors du chargement des informations de l'animal"
        this.loading = false
      },
    })
  }

  getTranslatedAnimalType(animalType: string): string {
    // If we have the animalType object with label, use it directly
    if (this.petInfo?.animalType?.label) {
      return this.petInfo.animalType.label
    }

    // Fallback translations for direct animal type strings
    const translations: { [key: string]: string } = {
      dog: "Chien",
      cat: "Chat",
      bird: "Oiseau",
      rabbit: "Lapin",
      hamster: "Hamster",
      fish: "Poisson",
      turtle: "Tortue",
      snake: "Serpent",
      lizard: "Lézard",
      horse: "Cheval",
      other: "Autre",
    }
    return translations[animalType?.toLowerCase()] || animalType || "-"
  }

  updatePetEmoji() {
    if (this.petInfo) {
      const emojiMap: { [key: string]: string } = {
        dog: "🐕",
        cat: "🐱",
        bird: "🐦",
        rabbit: "🐰",
        hamster: "🐹",
        fish: "🐠",
        turtle: "🐢",
        snake: "🐍",
        lizard: "🦎",
        horse: "🐴",
        other: "🐾",
      }

      // Get animal type from the animalType object label or fallback to direct string
      const animalTypeKey = this.petInfo.animalType?.label?.toLowerCase() || "other"
      const emoji = emojiMap[animalTypeKey] || "🐾"

      setTimeout(() => {
        const emojiElement = document.getElementById("petEmoji")
        if (emojiElement) {
          emojiElement.textContent = emoji
        }
      }, 100)
    }
  }

  shareLocationViaWhatsApp() {
    if (!this.petInfo?.phoneNumbers || this.petInfo.phoneNumbers.length === 0) {
      alert("Numéro de téléphone non disponible")
      return
    }

    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
          const message = `J'ai trouvé ton animal et voilà ma localisation : ${mapsLink}`

          // Show options to share via WhatsApp or SMS
          this.showShareOptions(message)
        },
        (error) => {
          console.error("Erreur geolocation:", error)
          alert("Impossible d'accéder à votre localisation. Assurez-vous d'avoir donné les permissions.")
        },
      )
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur")
    }
  }

  async showShareOptions(message: string) {
    const alert = await this.alertController.create({
      header: "Choisir le moyen",
      message: "Comment voulez-vous partager votre localisation ?",
      buttons: [
        {
          text: "WhatsApp",
          handler: () => {
            this.shareViaWhatsApp(message)
          },
        },
        {
          text: "SMS",
          handler: () => {
            this.shareViaSMS(message)
          },
        },
        {
          text: "Annuler",
          role: "cancel",
        },
      ],
    })
    await alert.present()
  }

  shareViaWhatsApp(message: string) {
    const phoneNumber = this.petInfo?.phoneNumbers?.[0]?.replace(/[^0-9+]/g, "")
    const formattedPhone = phoneNumber?.startsWith("+") ? phoneNumber : "+216" + phoneNumber
    const encodedMessage = encodeURIComponent(message)
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    window.open(whatsappLink, "_blank")
  }

  shareViaSMS(message: string) {
    const phoneNumber = this.petInfo?.phoneNumbers?.[0]?.replace(/[^0-9+]/g, "")
    const encodedMessage = encodeURIComponent(message)
    const smsLink = `sms:${phoneNumber}?body=${encodedMessage}`
    window.location.href = smsLink
  }
}
