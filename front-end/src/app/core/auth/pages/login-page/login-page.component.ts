import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { InputPrimaryComponent } from "../../../../shared/components/input-primary/input-primary.component";
import { Router } from "@angular/router";

@Component({
  selector: "app-login-page",
  imports: [
    MatButtonModule,
    InputPrimaryComponent,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./login-page.component.html",
  styleUrl: "./login-page.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  loginError: string | null = null;
  hide = signal(true);

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [Validators.required]),
    });
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  onSubmit() {
    this.loginError = null;
    this.isLoading = true;

    if (this.loginForm.invalid) {
      this.isLoading = false;
      return;
    }

    console.log("Login (visual apenas):", this.loginForm.value);
    this.isLoading = false;
  }

  navigate() {
    this.router.navigate(["/signup"]);
  }
}
