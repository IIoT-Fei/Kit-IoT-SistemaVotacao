
/********************************************************************/
/** Código Fonte - Arduino + Shield Campus Party 2014              **/
/**                                                                **/
/** ┌──────────────────────────────────┐                           **/
/** │Revisão│ Descrição                           │    Data    │   **/
/** │  01   │ Revisão inicial                     │ 14.01.2014 │   **/
/** │  02   │ Removido DHT11 e SPL                │ 18.07.2014 │   **/
/** │       │                                                      **/
/** └──────────────────────────────────┘                           **/
/********************************************************************/

#include <CapacitiveSensor.h>

/*
 * Test variables
 */
#define TMPPIN A0
#define LUZPIN A1
#define CHAVEPIN 5
CapacitiveSensor cs_4_2 = CapacitiveSensor(4,2);
unsigned int chave = 0;
float tmp = 0;
int cap = 0;
unsigned int luz = 0;

/* 
 * End test variables
 */

bool debug = true;

int i = 0;

char messageBuffer[12];
char cmd[3];
char pin[3];
char val[4];
char aux[4];

void setup() {
  Serial.begin(115200);
  cs_4_2.set_CS_AutocaL_Millis(0xFFFFFFFF);
}

void loop() {
  while (Serial.available() > 0) {
    char x = Serial.read();

    if (x == '!') {
      i = 0;

    } else if (x == '.') {
      process();

    } else {
      messageBuffer[i++] = x;
    }
  }
  
  if (debug) {
     Test();
  }
}

/*
 * Deal with a full message and determine function to call
 */
void process() {
  i = 0;

  strncpy(cmd, messageBuffer, 2);
  cmd[2] = '\0';

  strncpy(pin, messageBuffer + 2, 2);
  pin[2] = '\0';

  if (atoi(cmd) > 90) {
    strncpy(val, messageBuffer + 4, 2);
    val[2] = '\0';

    strncpy(aux, messageBuffer + 6, 3);
    aux[3] = '\0';

  } else {
    strncpy(val, messageBuffer + 4, 3);
    val[3] = '\0';

    strncpy(aux, messageBuffer + 7, 3);
    aux[3] = '\0';
  }

  Debug(messageBuffer);

  int cmdid = atoi(cmd);

  switch (cmdid) {
    case 1 : dWrite(pin,val);     break;
    case 2 : dRead(pin,val);      break;
    case 3 : aWrite(pin,val);     break;
    case 4 : aRead(pin,val);      break;
    case 5 : capacitiveRead(pin); break;
    case 99: toggleDebug(val);    break;
    default:                      break;
  }
}

/*
 * Toggle debug mode
 */
void toggleDebug(char *val) {
  if (atoi(val) == 0) {
    debug = false;
    Serial.println("Debug Closed");

  } else {
    debug = true;
    Serial.println("Debugging");
  }
}

/*
 * Analog read
 */
void aRead(char *pin, char *val) {
  Debug("ar");

  int p = getPin(pin);

  if(p == -1) {
    Debug("badpin");
    return;
  }

  pinMode(p, INPUT);
  int rval = analogRead(p);

  char m[8];
  sprintf(m, "%s::%03d", pin, rval);
  Serial.println(m);
}


/*
 * Analog write
 */
void aWrite(char *pin, char *val) {
  Debug("aw");

  int p = getPin(pin);
  pinMode(p, OUTPUT);

  if(p == -1) {
    Debug("badpin");
    return;
  }

  analogWrite(p,atoi(val));
}


/*
 * Digital write
 */
void dWrite(char *pin, char *val) {
  Debug("dw");

  int p = getPin(pin);

  if(p == -1) {
    Debug("badpin");
    return;
  }

  pinMode(p, OUTPUT);

  if (atoi(val) == 0) {
    digitalWrite(p, LOW);

  } else {
    digitalWrite(p, HIGH);
  }
}

/*
 * Digital read
 */
void dRead(char *pin, char *val) {
  Debug("dr");

  int p = getPin(pin);

  if(p == -1) {
    Debug("badpin");
    return;
  }

  pinMode(p, INPUT);
  int oraw = digitalRead(p);

  char m[7];
  sprintf(m, "%02d::%02d", p,oraw);
  Serial.println(m);
}


/*
 * Converts to A0-A5, and returns -1 on error
 */
int getPin(char *pin) {
  int ret = -1;

  if(pin[0] == 'A' || pin[0] == 'a') {
    switch(pin[1]) {
      case '0': ret = A0; break;
      case '1': ret = A1; break;
      case '2': ret = A2; break;
      case '3': ret = A3; break;
      case '4': ret = A4; break;
      case '5': ret = A5; break;
      default:            break;
    }

  } else {
    ret = atoi(pin);

    if(ret == 0 && (pin[0] != '0' || pin[1] != '0')) {
      ret = -1;
    }
  }
  return ret;
}


/*
 * Capacitive Sensor read
 */
void capacitiveRead(char *pin) {
  Debug("capacitiveRead");
  char m[8];
  sprintf(m, "%s::%d", pin, cs_4_2.capacitiveSensor(30));
  Serial.println(m);
}


/*
 * Debug
 */
void Debug(char *name) {
  if (debug) {
    Serial.println(name);
  }
}


/*
 * Test pins
 */
void Test() {
  for(int i=0; i<30; i++){
    tmp = tmp + analogRead(TMPPIN);
    luz = luz + analogRead(LUZPIN);
    cap = cap + cs_4_2.capacitiveSensor(30);
  }
  tmp = tmp/30;
  luz = luz/30;
  cap = cap/30;
  
  chave = digitalRead(CHAVEPIN);

  Serial.print("Luz = ");
  Serial.print(luz);
  Serial.print(" | ");
  Serial.print("Chave = ");
  Serial.print(chave);
  Serial.print(" | ");
  Serial.print("Temperatura = ");
  Serial.print((float)tmp, 2);
  Serial.print(" | ");
  Serial.print("Capacidade = ");
  Serial.print(cap);
  Serial.print('\n');

  cap = luz = tmp = 0;
  
  delay(10);
}
