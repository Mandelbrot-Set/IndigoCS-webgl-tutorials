// from https://www.shadertoy.com/view/XlX3R4
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Overstepping from Eiffie's sans normal : https://www.shadertoy.com/view/Xll3zH
// Coloring and lighting based on IQ's Apollonian : https://www.shadertoy.com/view/4ds3zn

precision highp float;
uniform vec2  iResolution;
uniform float iTime;
uniform int   AA;

#define AUTO_OVERSTEP

const int MaxIter = 12;
float zoom=1.;


// Complex operations

vec2 cmul( vec2 a, vec2 b )  { return vec2( a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x ); }
vec2 csqr( vec2 a )  { return vec2( a.x*a.x - a.y*a.y, 2.*a.x*a.y  ); }

// Biomplex multiplication

vec4 bmul(vec4 a, vec4 b){vec2 dx = cmul(a.xy,b.xy)-cmul(a.zw,b.zw);vec2 dy = cmul(a.xy,b.zw)+cmul(a.zw,b.xy);return vec4(dx,dy);}

// Intersection with sphere from IQ

vec2 iSphere( in vec3 ro, in vec3 rd, in vec4 sph )
{
    vec3 oc = ro - sph.xyz;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b-h, -b+h );
}

// Distance estimation for bicomplex fractal

float de( vec3 p)
{
    float dr = 1.;
    p*=dr;
    float r2;
    vec4 z = vec4(p.yzx,0.);
    vec4 c= z;
    for( int i=0; i<MaxIter;i++ )
    {
        r2 = dot(z,z);
        if(r2>100.)continue;
        dr=2.*sqrt(r2)*dr+1.0;
        z=z.wxyz;
        z=bmul(z,z)+c;

    }
    return .5*length(z)*log(length(z))/dr;
}


// Orbit trapping for bicomplex fractal

vec4 map(in vec3 p,inout vec3 nor)
{
    float dr = 1.0;
    vec4 ot = vec4(1000.0);

    float r2;
    vec4 z = vec4(p.yzx,0.);
    vec4 c= z;
    vec4 pz= vec4(0.);
    float otl=100.;

    for( int i=0; i<MaxIter;i++ )
    {
        r2 = dot(z,z);
        if(r2>100.)continue;

        ot = min( ot, vec4(abs(z.xyz),r2) );

        pz=z;
        dr=2.*sqrt(r2)*dr+1.0;
        z=z.wxyz;
        z=bmul(z,z)+c;
    }

    nor= normalize((z-pz).xyz);
    return ot;
}


// Distance estimation for pseudo kleinian fractal


vec4 orb;
float de2( vec3 p )
{
    float scale = .4;
    vec3 CSize = vec3(1.0,0.8,1.1);
    float g=.85;
    orb = vec4(1000.0);
    p+=vec3(2.5,0.,2.5);
    p*=scale;


    for( int i=0; i<6;i++ )
    {

        p = (-1.0 + 2.0*fract(0.5*p*CSize+0.5))/CSize;
        p = clamp(p,-CSize,  CSize) * 2.0 - p;

        float r2 = dot(p,p);
        orb = min( orb, vec4(abs(p),r2) );
        float k = max(1.3/r2,.1)*g;

        p     *= k;
        scale *= k;

    }

    return 0.5*abs(p.y+.03)/scale;
}



bool hit1,hit2 = false;

vec3 calcNormal( in vec3 pos )
{
    vec3  delta = vec3(.0001,0.0,0.0);
    vec3 nor;
    if(hit1){
        nor.x = de(pos+delta.xyy) - de(pos-delta.xyy);
        nor.y = de(pos+delta.yxy) - de(pos-delta.yxy);
        nor.z = de(pos+delta.yyx) - de(pos-delta.yyx);
    }else{
        nor.x = de2(pos+delta.xyy) - de2(pos-delta.xyy);
        nor.y = de2(pos+delta.yxy) - de2(pos-delta.yxy);
        nor.z = de2(pos+delta.yyx) - de2(pos-delta.yyx);
    }
    return normalize(nor);
}


float march( in vec3 ro, in vec3 rd , in vec2 tminmax )
{
    float t = tminmax.x,pd=10.0,os=0.0,step;
    float dt = 1.;
    float dt1 = 1.;
    float dt2 = 1.;

    float preci =  .3/min(iResolution.x,iResolution.y);//0.001;//

    for(int i=0; i<128; i++)
    {

        if( t>tminmax.y || dt<=preci*t ) continue;
        vec3 pos = ro + t*rd;

        dt1 = de(pos);
        dt2 = de2(pos);
        dt= min(dt1,dt2);
        #ifdef AUTO_OVERSTEP
        if(dt>=os){		//we have NOT stepped over anything
            os=0.44*dt*dt/pd;//overstep based on ratio of this step to last
            step=dt+os;	//add in the overstep
            pd=dt;		//save this step length for next calc
        }else{step=-os*1.2;dt=1.0;pd=100000.0;os=0.0;}//remove overstep
            #else
        step=dt;
        #endif

        t += step;

    }
    if(t>tminmax.y||dt>preci*t)return-1.;
    if(dt1<dt2)hit1=true;
    else hit2=true;

    return t;
}


void main()
{
    vec2 q = gl_FragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0*q;
    p.x *= iResolution.x/ iResolution.y;
    vec2 mo = iMouse.xy / iResolution.xy;
    float an = 2.0 + 0.2*iTime - mo.x;

    vec3  light1 = vec3(  0.577, 0.577, -0.577 );
    vec3  light2 = vec3( -0.707, 0.000,  0.707 );

    vec3 ro = zoom*1.7*vec3(cos(an), .6-0.5*cos(2.*an), sin(an));
    vec3 ta = vec3(0.0,.6, 0.0);
    vec3 ww = normalize( ta - ro);
    vec3 uu = normalize( cross( vec3(0.0,1.0,0.0), ww ) );
    vec3 vv = normalize( cross(ww,uu) );
    vec3 rd = normalize( p.x*uu + p.y*vv + 1.0*ww );

    vec3 col = vec3(0.0);
    float t;
    vec2 seg= vec2(0.,30.);;


    t = march( ro, rd, seg );
    if(t>=0.&&hit1){//Bicomplex
        //t-=.01;
        vec3 nor=vec3(0.);
        vec3 pos = ro+ t* rd;
        vec4 res = map( pos,nor );
        vec3 col1 =clamp(res.xyz,0.,1.);
        col1=.5*(col1+col1.brg);
        col1.g+=col1.r;
        if(pos.y>1.5)col1=vec3(.9,.9,.2);
        vec3 nor1 = calcNormal( pos);
        //nor1=nor;

        // lighting

        float key = clamp( dot( light1, nor1 ), 0.0, 1.0 );
        float bac = clamp( 0.2 + 0.8*dot( light2, nor1 ), 0.0, 1.0 );
        float amb = (0.7+0.3*nor1.y);
        float ao = pow( clamp(res.a*2.0,0.2,1.0), 2.2 );
        vec3 brdf = vec3(ao)*(.4*amb+1.5*key+.2*bac);

        col = col1*brdf;


        //Light Strings

        vec3 lightString1=vec3(.7,.6,0.2);
        vec3 lightString2=vec3(.4,.5,0.7);
        if(fract(iTime)<.5)lightString1=vec3(0.);
        if(fract(1.3*iTime)>.5)lightString2=vec3(0.);
        if(abs(res.x-sin(res.y))<.0005)col+=lightString1;
        if(abs(res.y-sin(res.z))<.0005)col+=lightString2;



    }


    vec3 c = vec3(.8,.4,.5);
    seg = iSphere( ro, rd, vec4(c,0.05) );
    if(seg.x<t&&seg.y>0.||t<0.&&seg.x>0.){
        col=   vec3(  0.8, 0., 0. );
        vec3 pos = ro+ seg.x* rd;
        vec3 nor = normalize(pos-c);
        float key = clamp( dot( light1, nor ), 0.0, 1.0 );
        nor = reflect(rd, nor);
        col*=(.2+key);
        col += pow(max(dot(light1, nor), 0.0), 25.0)*vec3(.3);
        hit2=false;
    }
    c = vec3(-.32,1.15,-.0);
    seg = iSphere( ro, rd, vec4(c,0.05) );
    if(seg.x<t&&seg.y>0.||t<0.&&seg.x>0.){
        col=   vec3(  0.0, 0., 0.7 );
        vec3 pos = ro+ seg.x* rd;
        vec3 nor = normalize(pos-c);
        float key = clamp( dot( light1, nor ), 0.0, 1.0 );
        nor = reflect(rd, nor);
        col*=(.2+key);
        col += pow(max(dot(light1, nor), 0.0), 25.0)*vec3(.3);
        hit2=false;
    }


    if( t>0.0&&hit2 )
    {

        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos );

        // lighting

        float key = clamp( dot( light1, nor ), 0.0, 1.0 );
        float bac = clamp( 0.2 + 0.8*dot( light2, nor ), 0.0, 1.0 );
        float amb = (0.7+0.3*nor.y);
        float ao = pow( clamp(orb.w*2.0,0.0,1.0), 1.2 );

        vec3 brdf  = 1.0*vec3(0.40,0.40,0.40)*amb*ao;
        brdf += 1.0*vec3(1.00,1.00,1.00)*key*ao;
        brdf += 1.0*vec3(0.40,0.40,0.40)*bac*ao;

        // material
        vec3 rgb = vec3(1.0);
        rgb = mix( rgb, vec3(1.0,0.80,0.2), clamp(6.0*orb.y,0.0,1.0) );
        rgb = mix( rgb, vec3(1.0,0.55,0.0), pow(clamp(1.0-2.0*orb.z,0.0,1.0),8.0) );

        col = rgb*brdf*exp(-0.2*t);
    }

    col = pow( col, vec3(0.4) ) * 1.2;

    col *= sqrt( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y) );

    gl_FragColor = vec4( col, 1.0 );
}
