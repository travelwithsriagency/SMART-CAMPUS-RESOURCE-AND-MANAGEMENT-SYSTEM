/*
 SMART CAMPUS RESOURCE & NAVIGATION SYSTEM
 Data Structures Laboratory Project - C
 Compile: gcc main.c -o smart_campus
 Run:     ./smart_campus       (Windows: smart_campus.exe)
*/
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#define MAX 100
#define INF 1000000000

/* ---------- 2(a): List ADT using array ---------- */
typedef struct { int id; char name[40]; int quantity; } Resource;
Resource resources[MAX];
int resourceCount = 0;

void listADT(void) {
    int choice, i, id, pos;
    Resource r;
    do {
        printf("\n--- LIST ADT: RESOURCE RECORDS ---\n1.Add  2.Display  3.Search ID  4.Delete ID  0.Back\nChoice: ");
        scanf("%d", &choice);
        if (choice == 1) {
            if (resourceCount == MAX) { puts("List is full."); continue; }
            printf("Enter ID, name(no spaces), quantity: ");
            if (scanf("%d %39s %d", &r.id, r.name, &r.quantity) != 3) return;
            resources[resourceCount++] = r; puts("Resource added.");
        } else if (choice == 2) {
            if (!resourceCount) puts("No resources.");
            for (i=0;i<resourceCount;i++) printf("%d  %-20s qty=%d\n", resources[i].id, resources[i].name, resources[i].quantity);
        } else if (choice == 3) {
            printf("ID: "); scanf("%d",&id); pos=-1;
            for(i=0;i<resourceCount;i++) if(resources[i].id==id) {pos=i;break;}
            if(pos<0) puts("Not found."); else printf("Found: %d %s qty=%d\n",resources[pos].id,resources[pos].name,resources[pos].quantity);
        } else if (choice == 4) {
            printf("ID to delete: "); scanf("%d",&id); pos=-1;
            for(i=0;i<resourceCount;i++) if(resources[i].id==id){pos=i;break;}
            if(pos<0) puts("Not found."); else {for(i=pos;i<resourceCount-1;i++)resources[i]=resources[i+1];resourceCount--;puts("Deleted.");}
        }
    } while(choice != 0);
}

/* ---------- 2(b): Multidimensional array ---------- */
void timetable(void) {
    int rooms, days, i, j, a[MAX][MAX];
    printf("Number of rooms (1-%d): ", MAX); scanf("%d",&rooms);
    printf("Number of days (1-%d): ", MAX); scanf("%d",&days);
    if(rooms<1||rooms>MAX||days<1||days>MAX){puts("Invalid dimensions.");return;}
    for(i=0;i<rooms;i++) for(j=0;j<days;j++){printf("Occupancy room %d, day %d: ",i+1,j+1);scanf("%d",&a[i][j]);}
    puts("Occupancy matrix:");
    for(i=0;i<rooms;i++){for(j=0;j<days;j++)printf("%5d",a[i][j]);puts("");}
}

/* ---------- 3: Singly and circular linked lists ---------- */
typedef struct SNode { int id; struct SNode *next; } SNode;
void singlyList(void) {
    SNode *head=NULL,*tail=NULL,*p,*n; int c,id;
    do {
        printf("\nSINGLY LINKED LIST: 1.Append 2.Display 3.Delete ID 0.Back\nChoice: "); scanf("%d",&c);
        if(c==1){printf("Resource/student ID: ");scanf("%d",&id);n=malloc(sizeof(*n));if(!n){puts("Memory error");break;}n->id=id;n->next=NULL;if(!head)head=n;else tail->next=n;tail=n;}
        else if(c==2){for(p=head;p;p=p->next)printf("%d -> ",p->id);puts("NULL");}
        else if(c==3){printf("ID: ");scanf("%d",&id);p=head;SNode *prev=NULL;while(p&&p->id!=id){prev=p;p=p->next;}if(!p)puts("Not found.");else{if(prev)prev->next=p->next;else head=p->next;if(tail==p)tail=prev;free(p);puts("Deleted.");}}
    }while(c!=0);
    while(head){p=head;head=head->next;free(p);}
}
void circularList(void) {
    SNode *tail=NULL,*p,*n; int c,id;
    do{
        printf("\nCIRCULAR LIST: 1.Add member 2.Display one round 0.Back\nChoice: ");scanf("%d",&c);
        if(c==1){printf("Student ID: ");scanf("%d",&id);n=malloc(sizeof(*n));if(!n)break;n->id=id;if(!tail){tail=n;n->next=n;}else{n->next=tail->next;tail->next=n;tail=n;}}
        else if(c==2){if(!tail)puts("Empty.");else{p=tail->next;do{printf("%d -> ",p->id);p=p->next;}while(p!=tail->next);puts("(back to start)");}}
    }while(c!=0);
    if(tail){p=tail->next;tail->next=NULL;while(p){n=p;p=p->next;free(n);}}
}

/* ---------- 4: Doubly linked list ---------- */
typedef struct DNode { int id; struct DNode *prev,*next; } DNode;
void doublyList(void){
    DNode *head=NULL,*tail=NULL,*p,*n;int c,id;
    do{
        printf("\nDOUBLY LINKED LIST: 1.Append booking 2.Forward 3.Backward 0.Back\nChoice: ");scanf("%d",&c);
        if(c==1){printf("Booking ID: ");scanf("%d",&id);n=malloc(sizeof(*n));if(!n)break;n->id=id;n->next=NULL;n->prev=tail;if(tail)tail->next=n;else head=n;tail=n;}
        else if(c==2){for(p=head;p;p=p->next)printf("%d <-> ",p->id);puts("NULL");}
        else if(c==3){for(p=tail;p;p=p->prev)printf("%d <-> ",p->id);puts("NULL");}
    }while(c!=0);
    while(head){p=head;head=head->next;free(p);}
}

/* ---------- 5: Polynomial addition ---------- */
void polynomial(void){
    int a[20]={0},b[20]={0},c[20],na,nb,i,e,coef;
    printf("Number of terms in polynomial P (max 20): ");scanf("%d",&na);
    if(na<0||na>20){puts("Invalid.");return;}
    for(i=0;i<na;i++){printf("Coefficient and exponent: ");scanf("%d%d",&coef,&e);if(e<0||e>=20){puts("Exponent must be 0..19.");return;}a[e]+=coef;}
    printf("Number of terms in polynomial Q (max 20): ");scanf("%d",&nb);
    if(nb<0||nb>20){puts("Invalid.");return;}
    for(i=0;i<nb;i++){printf("Coefficient and exponent: ");scanf("%d%d",&coef,&e);if(e<0||e>=20){puts("Exponent must be 0..19.");return;}b[e]+=coef;}
    for(i=0;i<20;i++)c[i]=a[i]+b[i];
    printf("P + Q = ");
    {int printed=0;for(i=19;i>=0;i--)if(c[i]){if(printed)printf(" + ");printf("%dx^%d",c[i],i);printed=1;}if(!printed)printf("0");puts("");}
}

/* ---------- 6: Stack array and linked stack ---------- */
int astack[MAX], atop=-1;
void stackArray(void){
    int c,x;do{printf("\nARRAY STACK: 1.Push 2.Pop 3.Display 0.Back\nChoice: ");scanf("%d",&c);
        if(c==1){if(atop==MAX-1)puts("Overflow.");else{printf("Value: ");scanf("%d",&x);astack[++atop]=x;}}
        else if(c==2){if(atop<0)puts("Underflow.");else printf("Popped %d\n",astack[atop--]);}
        else if(c==3){for(x=atop;x>=0;x--)printf("%d\n",astack[x]);}
    }while(c!=0);
}
typedef struct StackNode{int x;struct StackNode*next;}StackNode;
void stackLinked(void){
    StackNode *top=NULL,*p;int c,x;do{printf("\nLINKED STACK: 1.Push 2.Pop 3.Display 0.Back\nChoice: ");scanf("%d",&c);
        if(c==1){printf("Value: ");scanf("%d",&x);p=malloc(sizeof(*p));if(!p)break;p->x=x;p->next=top;top=p;}
        else if(c==2){if(!top)puts("Underflow.");else{p=top;printf("Popped %d\n",p->x);top=top->next;free(p);}}
        else if(c==3){for(p=top;p;p=p->next)printf("%d\n",p->x);}
    }while(c!=0);while(top){p=top;top=top->next;free(p);}
}

/* ---------- 7: Infix to postfix and postfix evaluation (single-digit operands) ---------- */
int prec(char c){return c=='^'?3:(c=='*'||c=='/'||c=='%')?2:(c=='+'||c=='-')?1:0;}
void infixPostfix(void){
    char in[200],out[200],st[200];int top=-1,j=0,i;printf("Enter infix expression (single-digit operands, no spaces): ");scanf("%199s",in);
    for(i=0;in[i];i++){char ch=in[i];if(isdigit((unsigned char)ch))out[j++]=ch;
        else if(ch=='(')st[++top]=ch;
        else if(ch==')'){while(top>=0&&st[top]!='(')out[j++]=st[top--];if(top>=0)top--;}
        else if(strchr("+-*/%^",ch)){while(top>=0&&st[top]!='('&&(prec(st[top])>prec(ch)||(prec(st[top])==prec(ch)&&ch!='^')))out[j++]=st[top--];st[++top]=ch;}
        else{puts("Invalid character.");return;}}
    while(top>=0){if(st[top]!='(')out[j++]=st[top];top--;}out[j]='\0';printf("Postfix: %s\n",out);
}
void postfixEval(void){
    char s[200];int st[200],top=-1,i,a,b;printf("Enter postfix expression (single-digit operands): ");scanf("%199s",s);
    for(i=0;s[i];i++){char ch=s[i];if(isdigit((unsigned char)ch))st[++top]=ch-'0';else if(strchr("+-*/%^",ch)&&top>=1){b=st[top--];a=st[top--];if((ch=='/'||ch=='%')&&b==0){puts("Division by zero.");return;}switch(ch){case '+':a+=b;break;case '-':a-=b;break;case '*':a*=b;break;case '/':a/=b;break;case '%':a%=b;break;case '^':{int r=1,k;for(k=0;k<b;k++)r*=a;a=r;break;}}st[++top]=a;}else{puts("Invalid postfix expression.");return;}}
    if(top==0)printf("Result: %d\n",st[top]);else puts("Invalid postfix expression.");
}
void hanoi(int n,char from,char aux,char to){if(n<=0)return;hanoi(n-1,from,to,aux);printf("Move disk %d from %c to %c\n",n,from,to);hanoi(n-1,aux,from,to);}
void hanoiMenu(void){int n;printf("Number of disks (1..10): ");scanf("%d",&n);if(n<1||n>10)puts("Choose 1..10.");else hanoi(n,'A','B','C');}

/* ---------- 8: Queues ---------- */
int qarr[MAX],qfront=0,qrear=-1;
void queueArray(void){int c,x;do{printf("\nARRAY QUEUE: 1.Enqueue 2.Dequeue 3.Display 0.Back\nChoice: ");scanf("%d",&c);
    if(c==1){if(qrear==MAX-1)puts("Queue full.");else{printf("Student ID: ");scanf("%d",&x);qarr[++qrear]=x;}}
    else if(c==2){if(qfront>qrear)puts("Queue empty.");else printf("Served %d\n",qarr[qfront++]);}
    else if(c==3){for(x=qfront;x<=qrear;x++)printf("%d ",qarr[x]);puts("");if(qfront>qrear)puts("Empty.");}
}while(c!=0);if(qfront>qrear){qfront=0;qrear=-1;}}
typedef struct QNode{int x;struct QNode*next;}QNode;
void queueLinked(void){QNode *f=NULL,*r=NULL,*p;int c,x;do{printf("\nLINKED QUEUE: 1.Enqueue 2.Dequeue 3.Display 0.Back\nChoice: ");scanf("%d",&c);
    if(c==1){printf("Student ID: ");scanf("%d",&x);p=malloc(sizeof(*p));if(!p)break;p->x=x;p->next=NULL;if(r)r->next=p;else f=p;r=p;}
    else if(c==2){if(!f)puts("Empty.");else{p=f;printf("Served %d\n",p->x);f=f->next;if(!f)r=NULL;free(p);}}
    else if(c==3){for(p=f;p;p=p->next)printf("%d ",p->x);puts("");}
}while(c!=0);while(f){p=f;f=f->next;free(p);}}
void circularQueue(void){int a[MAX],f=0,r=-1,count=0,c,x;do{printf("\nCIRCULAR QUEUE: 1.Enqueue 2.Dequeue 3.Display 0.Back\nChoice: ");scanf("%d",&c);
    if(c==1){if(count==MAX)puts("Full.");else{printf("Student ID: ");scanf("%d",&x);r=(r+1)%MAX;a[r]=x;count++;}}
    else if(c==2){if(!count)puts("Empty.");else{printf("Served %d\n",a[f]);f=(f+1)%MAX;count--;}}
    else if(c==3){int i;for(i=0;i<count;i++)printf("%d ",a[(f+i)%MAX]);puts("");}
}while(c!=0);}

/* ---------- 9: Binary tree traversals and BST operations ---------- */
typedef struct TNode{int key;struct TNode*l,*r;}TNode;
TNode* newT(int k){TNode*n=malloc(sizeof(*n));if(!n)return NULL;n->key=k;n->l=n->r=NULL;return n;}
void preorder(TNode*n){if(n){printf("%d ",n->key);preorder(n->l);preorder(n->r);}}
void inorder(TNode*n){if(n){inorder(n->l);printf("%d ",n->key);inorder(n->r);}}
void postorder(TNode*n){if(n){postorder(n->l);postorder(n->r);printf("%d ",n->key);}}
TNode* insertBST(TNode*n,int k){if(!n)return newT(k);if(k<n->key)n->l=insertBST(n->l,k);else if(k>n->key)n->r=insertBST(n->r,k);return n;}
TNode* minNode(TNode*n){while(n&&n->l)n=n->l;return n;}
TNode* deleteBST(TNode*n,int k){if(!n)return NULL;if(k<n->key)n->l=deleteBST(n->l,k);else if(k>n->key)n->r=deleteBST(n->r,k);else{if(!n->l){TNode*t=n->r;free(n);return t;}if(!n->r){TNode*t=n->l;free(n);return t;}TNode*t=minNode(n->r);n->key=t->key;n->r=deleteBST(n->r,t->key);}return n;}
void freeTree(TNode*n){if(n){freeTree(n->l);freeTree(n->r);free(n);}}
void treeMenu(void){TNode*root=NULL,*p;int c,x;do{printf("\nBST/TREE: 1.Insert 2.Search 3.Delete 4.Inorder 5.Preorder 6.Postorder 0.Back\nChoice: ");scanf("%d",&c);
    if(c==1){printf("Resource ID: ");scanf("%d",&x);root=insertBST(root,x);}
    else if(c==2){printf("Search ID: ");scanf("%d",&x);p=root;while(p&&p->key!=x)p=x<p->key?p->l:p->r;puts(p?"Found.":"Not found.");}
    else if(c==3){printf("Delete ID: ");scanf("%d",&x);root=deleteBST(root,x);}
    else if(c==4){inorder(root);puts("");}
    else if(c==5){preorder(root);puts("");}
    else if(c==6){postorder(root);puts("");}
}while(c!=0);freeTree(root);}

/* ---------- 10: Priority queue using max heap ---------- */
int heap[MAX],hn=0;
void heapPush(int x){int i=++hn;while(i>1&&heap[i/2]<x){heap[i]=heap[i/2];i/=2;}heap[i]=x;}
int heapPop(void){int out=heap[1],last=heap[hn--],i=1,ch;while(i*2<=hn){ch=i*2;if(ch+1<=hn&&heap[ch+1]>heap[ch])ch++;if(last>=heap[ch])break;heap[i]=heap[ch];i=ch;}if(hn>0)heap[i]=last;return out;}
void priorityQueue(void){int c,x,i;do{printf("\nPRIORITY QUEUE (larger number = higher priority): 1.Add request 2.Serve highest 3.Display heap 0.Back\nChoice: ");scanf("%d",&c);
    if(c==1){if(hn==MAX-1)puts("Full.");else{printf("Priority (integer): ");scanf("%d",&x);heapPush(x);}}
    else if(c==2){if(!hn)puts("No requests.");else printf("Served priority %d\n",heapPop());}
    else if(c==3){for(i=1;i<=hn;i++)printf("%d ",heap[i]);puts("");}
}while(c!=0);}

/* ---------- 11-13: Graph algorithms ---------- */
int g[MAX][MAX],V=0;
void readGraph(void){int i,j;printf("Number of campus locations (1..%d): ",MAX);scanf("%d",&V);if(V<1||V>MAX){V=0;puts("Invalid.");return;}
    puts("Enter adjacency/weight matrix (0 means no edge; diagonal 0):");for(i=0;i<V;i++)for(j=0;j<V;j++){scanf("%d",&g[i][j]);if(g[i][j]<0){puts("Negative weights not supported.");V=0;return;}}}
void bfsdfs(void){int start,i,visited[MAX]={0},q[MAX],f=0,r=0,stack[MAX],top=-1,u,v,choice;
    readGraph();if(!V)return;printf("Start vertex (0..%d): ",V-1);scanf("%d",&start);if(start<0||start>=V)return;
    printf("1.BFS 2.DFS: ");scanf("%d",&choice);
    if(choice==1){visited[start]=1;q[r++]=start;printf("BFS: ");while(f<r){u=q[f++];printf("%d ",u);for(v=0;v<V;v++)if(g[u][v]&&!visited[v]){visited[v]=1;q[r++]=v;}}puts("");}
    else{stack[++top]=start;printf("DFS: ");while(top>=0){u=stack[top--];if(visited[u])continue;visited[u]=1;printf("%d ",u);for(v=V-1;v>=0;v--)if(g[u][v]&&!visited[v])stack[++top]=v;}puts("");}}
void topoSort(void){int indeg[MAX]={0},q[MAX],f=0,r=0,i,j,count=0,u;readGraph();if(!V)return;
    for(i=0;i<V;i++)for(j=0;j<V;j++)if(g[i][j])indeg[j]++;
    for(i=0;i<V;i++)if(!indeg[i])q[r++]=i;
    printf("Topological order: ");while(f<r){u=q[f++];printf("%d ",u);count++;for(j=0;j<V;j++)if(g[u][j]&&--indeg[j]==0)q[r++]=j;}
    if(count!=V)puts("\nGraph contains a cycle; topological ordering is impossible.");else puts("");
}
void prim(void){int used[MAX]={0},i,j,edges=0,total=0,min,u=-1,v=-1;readGraph();if(!V)return;used[0]=1;
    printf("Prim MST edges:\n");while(edges<V-1){min=INF;u=v=-1;for(i=0;i<V;i++)if(used[i])for(j=0;j<V;j++)if(!used[j]&&g[i][j]>0&&g[i][j]<min){min=g[i][j];u=i;v=j;}
        if(u<0){puts("Graph is disconnected.");return;}printf("%d - %d (weight %d)\n",u,v,min);used[v]=1;total+=min;edges++;}printf("Total cost = %d\n",total);}
typedef struct{int u,v,w;}Edge;
int parent[MAX];
int findSet(int x){while(parent[x]!=x){parent[x]=parent[parent[x]];x=parent[x];}return x;}
void unionSet(int a,int b){parent[findSet(a)]=findSet(b);}
void kruskal(void){Edge e[MAX*MAX];int n=0,i,j,k,total=0,chosen=0;readGraph();if(!V)return;
    for(i=0;i<V;i++)for(j=i+1;j<V;j++)if(g[i][j]>0){e[n].u=i;e[n].v=j;e[n++].w=g[i][j];}
    for(i=0;i<n;i++)for(j=i+1;j<n;j++)if(e[j].w<e[i].w){Edge t=e[i];e[i]=e[j];e[j]=t;}
    for(i=0;i<V;i++)parent[i]=i;puts("Kruskal MST edges:");
    for(k=0;k<n&&chosen<V-1;k++)if(findSet(e[k].u)!=findSet(e[k].v)){unionSet(e[k].u,e[k].v);printf("%d - %d (weight %d)\n",e[k].u,e[k].v,e[k].w);total+=e[k].w;chosen++;}
    if(chosen!=V-1)puts("Graph is disconnected.");else printf("Total cost = %d\n",total);
}
void dijkstra(void){int d[MAX],used[MAX]={0},prev[MAX],i,j,u,min,src,dest;readGraph();if(!V)return;
    printf("Source and destination (0..%d): ",V-1);scanf("%d%d",&src,&dest);if(src<0||src>=V||dest<0||dest>=V)return;
    for(i=0;i<V;i++){d[i]=INF;prev[i]=-1;}d[src]=0;
    for(i=0;i<V;i++){u=-1;min=INF;for(j=0;j<V;j++)if(!used[j]&&d[j]<min){min=d[j];u=j;}if(u<0)break;used[u]=1;
        for(j=0;j<V;j++)if(g[u][j]>0&&d[u]+g[u][j]<d[j]){d[j]=d[u]+g[u][j];prev[j]=u;}}
    if(d[dest]==INF){puts("No route.");return;}printf("Shortest distance = %d\nPath: ",d[dest]);{int path[MAX],n=0,x=dest;while(x!=-1&&n<MAX){path[n++]=x;x=prev[x];}for(i=n-1;i>=0;i--)printf("%d%s",path[i],i?" -> ":"\n");}
}

void help(void){
    puts("\nPROJECT NOTES");
    puts("- Resource list, timetable, linked lists, stacks and queues model campus resources and student flow.");
    puts("- Tree/BST manages integer resource IDs; heap prioritizes maintenance requests.");
    puts("- Graph vertices are campus locations numbered 0..V-1; matrix values are edge costs.");
    puts("- For graph algorithms, use 0 for no edge and positive numbers for edge weights.");
    puts("- Topological sort expects a directed acyclic graph; Prim/Kruskal expect an undirected graph.");
    puts("- Expression tools accept single-digit operands without spaces, e.g. (2+3)*4.");
    puts("- Polynomial input: each term is entered as coefficient then exponent.");
}
int main(void){
    int c;
    do{
        printf("\n============================================\n");
        printf(" SMART CAMPUS RESOURCE & NAVIGATION SYSTEM\n");
        printf(" Data Structures Project in C\n");
        printf("============================================\n");
        puts("1. List ADT - resource records");
        puts("2. Multidimensional array - timetable");
        puts("3. Singly linked list");
        puts("4. Circular linked list");
        puts("5. Doubly linked list");
        puts("6. Polynomial addition");
        puts("7. Stack using array");
        puts("8. Stack using linked list");
        puts("9. Infix to postfix conversion");
        puts("10. Postfix evaluation");
        puts("11. Tower of Hanoi");
        puts("12. Queue using array");
        puts("13. Queue using linked list");
        puts("14. Circular queue");
        puts("15. Binary tree/BST: insert, search, delete, traversals");
        puts("16. Priority queue using heap");
        puts("17. Graph traversal - BFS/DFS");
        puts("18. Topological sort");
        puts("19. Minimum spanning tree - Prim");
        puts("20. Minimum spanning tree - Kruskal");
        puts("21. Dijkstra shortest path");
        puts("22. Help / graph input guide");
        puts("0. Exit");
        printf("Enter choice: ");
        if(scanf("%d",&c)!=1) break;
        switch(c){
            case 1:listADT();break;case 2:timetable();break;case 3:singlyList();break;
            case 4:circularList();break;case 5:doublyList();break;case 6:polynomial();break;
            case 7:stackArray();break;case 8:stackLinked();break;case 9:infixPostfix();break;
            case 10:postfixEval();break;case 11:hanoiMenu();break;case 12:queueArray();break;
            case 13:queueLinked();break;case 14:circularQueue();break;case 15:treeMenu();break;
            case 16:priorityQueue();break;case 17:bfsdfs();break;case 18:topoSort();break;
            case 19:prim();break;case 20:kruskal();break;case 21:dijkstra();break;case 22:help();break;
            case 0:puts("Thank you. Exiting Smart Campus System.");break;
            default:puts("Invalid choice.");
        }
    }while(c!=0);
    return 0;
}
